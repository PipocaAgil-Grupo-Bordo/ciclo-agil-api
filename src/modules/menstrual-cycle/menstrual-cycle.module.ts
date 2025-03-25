import { Module } from '@nestjs/common';

import { MenstrualPeriodRepository } from '../menstrual-period/menstrual-period.repository';
import { ProfileRepository } from '../profile/profile.repository';
import { MenstrualCycleV2Controller } from './menstrual-cycle-v2.controller';
import { MenstrualCycleService } from './menstrual-cycle.service';

@Module({
    imports: [],
    exports: [MenstrualCycleService],
    controllers: [MenstrualCycleV2Controller],
    providers: [MenstrualPeriodRepository, ProfileRepository, MenstrualCycleService],
})
export class MenstrualCycleModule {}
