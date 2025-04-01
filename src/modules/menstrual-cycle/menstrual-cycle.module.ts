import { Module } from '@nestjs/common';

import { MenstrualPeriodRepository } from '../menstrual-period/menstrual-period.repository';
import { ProfileRepository } from '../profile/profile.repository';
import { MenstrualCycleController } from './menstrual-cycle.controller';
import { MenstrualCycleService } from './menstrual-cycle.service';

@Module({
    imports: [],
    exports: [MenstrualCycleService],
    controllers: [MenstrualCycleController],
    providers: [MenstrualPeriodRepository, ProfileRepository, MenstrualCycleService],
})
export class MenstrualCycleModule {}
