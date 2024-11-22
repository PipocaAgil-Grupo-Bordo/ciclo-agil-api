import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateMenstrualPeriodDateDto } from './dtos/create-menstrual-date.dto';
import { MenstrualPeriodService } from './menstrual-period.service';

//This controller will be replaced with in the menstrual period controller v2 but we'll keep this one for now
@Controller('menstrual-period')
export class MenstrualPeriodController {
    constructor(private readonly menstrualPeriodService: MenstrualPeriodService) {}

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async getMenstrualPeriods(
        @Request() req: any,
        @Query('year') year?: string,
        @Query('month') month?: string,
    ) {
        const user = req.user;
        return this.menstrualPeriodService.getByDate(user.id, year, month);
    }

    @Get('forecasting')
    @UseGuards(AuthGuard('jwt'))
    async getForecasting(
        @Request() req: any,
    ) {
        const user = req.user;
        return this.menstrualPeriodService.getForecasting(user.id);
    }

    @Get('last')
    @UseGuards(AuthGuard('jwt'))
    async getLastMenstrualPeriod(@Request() req: any) {
        const user = req.user;
        const lastPeriod = await this.menstrualPeriodService.getLastByUserId(user.id);
        return lastPeriod;
    }

    @Post('date')
    @UseGuards(AuthGuard('jwt'))
    createDate(@Request() req: any, @Body() body: CreateMenstrualPeriodDateDto) {
        const user = req.user;
        return this.menstrualPeriodService.createDate(body, user.id);
    }

    @Delete('date/:id')
    @UseGuards(AuthGuard('jwt'))
    deleteDate(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        const user = req.user;
        return this.menstrualPeriodService.deleteDate(id, user.id);
    }
}
