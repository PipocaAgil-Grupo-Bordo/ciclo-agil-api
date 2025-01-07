import { Body, Controller, Get, HttpStatus, Patch, Request, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profiles')
export class ProfileV2Controller {
    constructor(private readonly profileService: ProfileService) {}

    @Patch()
    @UseGuards(AuthGuard('jwt'))
    async upsert(@Request() req, @Body() body: UpdateProfileDto, @Res() res: Response) {
        const user = req.user;

        if (!body || Object.keys(body).length === 0) {
            return res.status(HttpStatus.NO_CONTENT).send();
        }

        const result = await this.profileService.upsert(body, user.id);
        res.json(result);
    }

    @Get('my-profile')
    @UseGuards(AuthGuard('jwt'))
    async getProfile(@Request() req) {
        const user = req.user;
        return this.profileService.findOne(user.id);
    }
}
