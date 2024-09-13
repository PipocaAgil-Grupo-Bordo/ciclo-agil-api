import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { DatabaseSeederService } from './database/seeder/database-seeder.service';
import { AuthModule } from './modules/auth/auth.module';
import { MenstrualPeriodModule } from './modules/menstrual-period/menstrual-period.module';
import { ProfileModule } from './modules/profile/profile.module';
import { UserModule } from './modules/user/user.module';
import { VerificationCodeModule } from './modules/verification-code/verification-code.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      isGlobal: true,
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
    VerificationCodeModule,
    MenstrualPeriodModule,
    ProfileModule,
  ],
  controllers: [],
  providers: [DatabaseSeederService],
})
export class AppModule {}
