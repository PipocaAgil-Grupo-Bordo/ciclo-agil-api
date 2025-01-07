import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { ProfileController } from './profile.controller';
import { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';
import { ProfileV2Controller } from './profile-v2.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Profile])],
    exports: [ProfileService],
    controllers: [ProfileController, ProfileV2Controller],
    providers: [ProfileService, ProfileRepository],
})
export class ProfileModule {}
