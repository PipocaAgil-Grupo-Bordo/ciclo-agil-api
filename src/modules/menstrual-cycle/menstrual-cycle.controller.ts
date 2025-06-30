import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AuthPayload } from '../../shared/types/auth-payload.interface';
import { MenstrualCycleService } from './menstrual-cycle.service';

@Controller('menstrual-cycle')
export class MenstrualCycleController {
    constructor(private readonly menstrualCycleService: MenstrualCycleService) {}

    @Get('forecasting')
    @UseGuards(AuthGuard('jwt'))
    async getForecasting(@CurrentUser() user: AuthPayload) {
        return this.menstrualCycleService.getForecasting(user.id);
    }
}
