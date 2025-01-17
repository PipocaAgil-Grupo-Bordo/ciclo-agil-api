import { Injectable, OnModuleInit } from '@nestjs/common';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class DatabaseSeederService implements OnModuleInit {
    constructor(private readonly userService: UserService) {}

    async onModuleInit() {
        this.seedUser();
    }

    async seedUser() {
        const newUser = {
            name: 'Mary Jane seed',
            email: 'mary@jane.com',
            password: 'Mary@jane1234',
            birthdate: '1995-08-17',
        };

        const existingUser = await this.userService.findByEmail(newUser.email);

        if (!existingUser) {
            this.userService.create(newUser);
        }
    }
}
