import { Body, Controller, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VerificationCodeService } from '../verification-code/verification-code.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { ResetPasswordRequestDto } from './dtos/reset-password-request.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { VerificationCodeValidationDto } from './dtos/verification-code-validation.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly verificationCodeService: VerificationCodeService,
    ) {}

    //TODO: Change the response http code to 200 OK
    @Post('login')
    login(@Body() body: LoginDto) {
        return this.authService.login(body);
    }

    @Get('whoami')
    @UseGuards(AuthGuard('jwt'))
    whoami(@Request() req) {
        const user = req.user;
        return user;
    }

    @Patch('reset-password')
    @UseGuards(AuthGuard('jwt'))
    async resetPassword(@Request() req, @Body() { password }: ResetPasswordDto) {
        const bearerToken = req.headers['authorization'];

        return await this.authService.resetPassword(bearerToken, password);
    }

    @Post('reset-password/request')
    async requestPasswordReset(@Body() { email }: ResetPasswordRequestDto) {
        return await this.authService.requestPasswordReset(email);
    }

    @Post('reset-password/validate')
    async validateVerificationCode(@Body() body: VerificationCodeValidationDto) {
        return await this.authService.validateVerificationCode(body);
    }

    @Post('refresh-token')
    refreshToken(@Body() { refreshToken }: RefreshTokenDto) {
        return this.authService.refreshToken(refreshToken);
    }
}
