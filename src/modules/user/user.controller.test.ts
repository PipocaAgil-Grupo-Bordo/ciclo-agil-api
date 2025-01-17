import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { VerificationCodeModule } from '../verification-code/verification-code.module';
import { CreateUserDto } from './dtos/create-user.dto';
import { UserModule } from './user.module';

describe('UserController', () => {
    let app: INestApplication;
    let dataSource: DataSource;

    const cleanDatabase = async () => {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.query('SET CONSTRAINTS ALL DEFERRED');
            await queryRunner.query('TRUNCATE TABLE "user" CASCADE');
            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
        } finally {
            await queryRunner.release();
        }
    };

    beforeAll(async () => {
        const testingModule: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    envFilePath: '.env.test',
                }),
                DatabaseModule,
                UserModule,
                AuthModule,
                VerificationCodeModule,
                ProfileModule,
            ],
        }).compile();

        app = testingModule.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());

        dataSource = testingModule.get<DataSource>(DataSource);

        await app.init();
    });

    beforeEach(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await cleanDatabase();
        await app.close();
    });

    it('should not create a new user if the body is invalid', async () => {
        const userDto = {
            name: 'Test User',
            email: 'test_user123@hotmail.com',
        };

        await request(app.getHttpServer())
            .post('/users')
            .send(userDto)
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('should not create a new user if the user already exists', async () => {
        const userDto: CreateUserDto = {
            name: 'Test User',
            email: 'test_user123@hotmail.com',
            password: 'Test@123456',
            birthdate: '1994-06-05',
        };

        await request(app.getHttpServer()).post('/users').send(userDto).expect(HttpStatus.CREATED);

        await request(app.getHttpServer()).post('/users').send(userDto).expect(HttpStatus.CONFLICT);
    });

    it('should create a new user', async () => {
        const userDto: CreateUserDto = {
            name: 'Test User',
            email: 'test_user123@hotmail.com',
            password: 'Test@123456',
            birthdate: '1994-06-05',
        };

        await request(app.getHttpServer())
            .post('/users')
            .send(userDto)
            .expect(HttpStatus.CREATED)
            .expect((res) => {
                expect(res.body.user.name).toBe(userDto.name);
            });
    });

    it('should return an array of users', async () => {
        await request(app.getHttpServer())
            .get('/users')
            .expect(HttpStatus.OK)
            .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
            });
    });
});
