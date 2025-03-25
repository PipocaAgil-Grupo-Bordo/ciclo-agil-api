import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MenstrualCycleService } from './menstrual-cycle.service';

//This controller will be replaced with in the menstrual period controller v2 but we'll keep this one for now
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
