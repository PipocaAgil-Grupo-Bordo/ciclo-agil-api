import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AuthPayload } from '../../shared/types/auth-payload.interface';
import { CreateMenstrualPeriodDateDto } from './dtos/create-menstrual-date.dto';
import { MenstrualPeriodService } from './menstrual-period.service';

@Controller('menstrual-periods')
export class MenstrualPeriodV2Controller {
    constructor(private readonly menstrualPeriodService: MenstrualPeriodService) {}

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async getMenstrualPeriods(
        @CurrentUser() user: AuthPayload,
        @Query('year') year?: string,
        @Query('month') month?: string,
    ) {
        return this.menstrualPeriodService.getByDate(user.id, year, month);
    }

    @Get('last')
    @UseGuards(AuthGuard('jwt'))
    async getLastMenstrualPeriod(@CurrentUser() user: AuthPayload) {
        const lastPeriod = await this.menstrualPeriodService.getLastByUserId(user.id);
        return lastPeriod;
    }

    @Post('dates')
    @UseGuards(AuthGuard('jwt'))
    createDate(@CurrentUser() user: AuthPayload, @Body() body: CreateMenstrualPeriodDateDto) {
        return this.menstrualPeriodService.createDate(body, user.id);
    }

    @Delete('dates/:id')
    @UseGuards(AuthGuard('jwt'))
    deleteDate(@CurrentUser() user: AuthPayload, @Param('id', ParseIntPipe) id: number) {
        return this.menstrualPeriodService.deleteDate(id, user.id);
    }
}
