import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../../shared/services/email/email.module';
import { EncryptionModule } from '../../shared/services/encryption/encryption.module';
import { ProfileModule } from '../profile/profile.module';
import { ProfileRepository } from '../profile/profile.repository';
import { MenstrualPeriod } from './entities/menstrual-period.entity';
import { MenstrualPeriodDateRepository } from './menstrual-period-date.repository';
import { MenstrualPeriodController } from './menstrual-period.controller';
import { MenstrualPeriodRepository } from './menstrual-period.repository';
import { MenstrualPeriodService } from './menstrual-period.service';
import { MenstrualPeriodV2Controller } from './menstrual-period-v2.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([MenstrualPeriod]),
        EncryptionModule,
        EmailModule,
        ProfileModule,
    ],
    exports: [MenstrualPeriodService],
    controllers: [MenstrualPeriodController, MenstrualPeriodV2Controller],
    providers: [
        MenstrualPeriodService,
        MenstrualPeriodRepository,
        MenstrualPeriodDateRepository,
        ProfileRepository,
    ],
})
export class MenstrualPeriodModule {}
