import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { DatabaseSeederService } from './database/seeder/database-seeder.service';
import { AuthModule } from './modules/auth/auth.module';
import { MenstrualCycleModule } from './modules/menstrual-cycle/menstrual-cycle.module';
import { MenstrualPeriodModule } from './modules/menstrual-period/menstrual-period.module';
import { ProfileModule } from './modules/profile/profile.module';
import { UserModule } from './modules/user/user.module';
import { VerificationCodeModule } from './modules/verification-code/verification-code.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        DatabaseModule,
        UserModule,
        AuthModule,
        VerificationCodeModule,
        MenstrualPeriodModule,
        ProfileModule,
        MenstrualCycleModule,
    ],
    controllers: [],
    providers: [DatabaseSeederService],
})
export class AppModule {}
