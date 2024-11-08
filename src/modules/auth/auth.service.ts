import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import {
    CustomForbiddenException,
    CustomNotFoundException,
    CustomUnauthorizedException,
} from '../../shared/exceptions/http-exception';
import { EmailService } from '../../shared/services/email/email.service';
import { EncryptionService } from '../../shared/services/encryption/encryption.service';
import { TokenService } from '../../shared/services/token/token.service';
import { UserService } from '../user/user.service';
import { VerificationCodeService } from '../verification-code/verification-code.service';
import { LoginDto } from './dtos/login.dto';
import { VerificationCodeValidationDto } from './dtos/verification-code-validation.dto';

@Injectable()
export class AuthService {
    constructor(
        @Inject(forwardRef(() => UserService))
        private userService: UserService,
        private encryptionService: EncryptionService,
        private tokenService: TokenService,
        private verificationCodeService: VerificationCodeService,
        private emailService: EmailService,
        private readonly jwtService: JwtService,
    ) {}
    async login(body: LoginDto) {
        const email = body.email.toLowerCase();
        const user = await this.userService.findByEmail(email);

        if (!user) {
            throw new CustomUnauthorizedException({
                code: 'invalid-email-or-password',
                message: 'Invalid email or password',
            });
        }

        const passwordMatch = await this.encryptionService.compare(body.password, user.password);

        if (!passwordMatch) {
            throw new CustomUnauthorizedException({
                code: 'invalid-email-or-password',
                message: 'Invalid email or password',
            });
        }

        const tokenSub: Record<string, unknown> = {
            userId: user.id,
            email: user.email,
        };

        const token = this.tokenService.createPair(tokenSub);

        delete user.password;

        return { user, token };
    }

    refreshToken(refreshToken: string) {
        const { sub: accessToken } = this.tokenService.verify(refreshToken) as JwtPayload;

        if (!accessToken) {
            throw new CustomForbiddenException({
                code: 'invalid-refresh-token',
                message: 'Invalid refresh token',
            });
        }

        const {
            sub: { userId, email },
        } = this.tokenService.decode(accessToken);

        if (!userId) {
            throw new CustomForbiddenException({
                code: 'invalid-refresh-token',
                message: 'Invalid refresh token',
            });
        }

        return this.tokenService.createPair({ userId, email });
    }

    async requestPasswordReset(email: string) {
        const user = await this.userService.findByEmail(email);

        if (!user) {
            throw new CustomNotFoundException({
                code: 'email-not-found',
                message: 'Email not found',
            });
        }

        const verificationCode = await this.verificationCodeService.generate();
        if (process.env.NODE_ENV !== 'test') {
            await this.emailService.sendVerificationCode(user, verificationCode);
        }
        await this.verificationCodeService.insert(verificationCode, email);

        return { message: `Verification code sent to ${email}` };
    }

    async validateVerificationCode({ code, email }: VerificationCodeValidationDto) {
        const user = await this.userService.findByEmail(email);

        if (!user) {
            throw new CustomUnauthorizedException({
                code: 'invalid-email',
                message: 'Invalid email',
            });
        }

        const validCode = await this.verificationCodeService.validate(code, email);

        if (!validCode.valid) {
            throw new CustomNotFoundException({
                code: 'invalid-or-expired-code',
                message: 'This code is invalid or has expired',
            });
        }

        const tokenSub: Record<string, unknown> = {
            code: validCode.code,
            userId: user.id,
            email: user.email,
        };

        const token = this.tokenService.create(tokenSub, { expiresIn: '1h' });

        return {
            verificationCode: validCode,
            token,
        };
    }

    async resetPassword(bearerToken: string, password: string) {
        const token = bearerToken.split(' ')[1];

        const { sub } = this.tokenService.decode(token);

        const validCode = await this.verificationCodeService.validate(sub.code, sub.email);

        if (!validCode.valid) {
            throw new CustomUnauthorizedException({
                code: 'invalid-token',
                message: 'This token is invalid or has already been used',
            });
        }

        await this.verificationCodeService.delete(validCode.id);

        return this.userService.update(sub.userId, { password });
    }
}
