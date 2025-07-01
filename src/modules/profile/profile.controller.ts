import { Body, Controller, Get, HttpStatus, Patch, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AuthPayload } from '../../shared/types/auth-payload.interface';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ProfileService } from './profile.service';

//This controller will be replaced with the profile controller v2 but we'll keep this one for now
@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Patch()
    @UseGuards(AuthGuard('jwt'))
    async upsert(
        @CurrentUser() user: AuthPayload,
        @Body() body: UpdateProfileDto,
        @Res() res: Response,
    ) {
        if (!body || Object.keys(body).length === 0) {
            return res.status(HttpStatus.NO_CONTENT).send();
        }

        const result = await this.profileService.upsert(body, user.id);
        res.json(result);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async getProfile(@CurrentUser() user: AuthPayload) {
        return this.profileService.findOne(user.id);
    }
}
