import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MenstrualCycleService } from './menstrual-cycle.service';

@Controller('menstrual-cycle')
export class MenstrualCycleController {
    constructor(private readonly menstrualCycleService: MenstrualCycleService) {}

    @Get('forecasting')
    @UseGuards(AuthGuard('jwt'))
    async getForecasting(@Request() req: any) {
        const user = req.user;
        return this.menstrualCycleService.getForecasting(user.id);
    }
}
