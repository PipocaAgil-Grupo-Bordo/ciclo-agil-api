import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcrypt';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { User } from '../user/entities/user.entity';
import { Profile } from './entities/profile.entity';
import { ProfileModule } from './profile.module';

describe('UserController', () => {
    let app: INestApplication;
    let dataSource: DataSource;

    const testUser = {
        name: 'testuser',
        password: 'testpassword',
        email: 'testuser@example.com',
        birthday: '25/12/1995',
    };

    let profile: Profile;

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

    const seedDatabase = async () => {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const hashedPassword = await hash(testUser.password, 10);

            const userResponse = await queryRunner.manager.save(User, {
                ...testUser,
                password: hashedPassword,
            });

            profile = await queryRunner.manager.save(Profile, {
                userId: userResponse.id,
                isMenstrualCycleRegular: true,
            });

            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
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
                ProfileModule,
                DatabaseModule,
                AuthModule,
            ],
        }).compile();

        app = testingModule.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());

        dataSource = testingModule.get<DataSource>(DataSource);

        await seedDatabase();
        await app.init();
    });

    afterAll(async () => {
        await cleanDatabase();
        await app.close();
    });

    it('should not be able to get the user profile without authentication', async () => {
        await request(app.getHttpServer()).get('/profile').expect(HttpStatus.UNAUTHORIZED);
    });

    it('should be able to get the user profile if authenticated', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                await request(app.getHttpServer())
                    .get('/profile')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .expect(HttpStatus.OK)
                    .expect((res) => {
                        expect(res.body.id).toBe(profile.id);
                    });
            });
    });

    it('should not be able to update the user profile without authentication', async () => {
        await request(app.getHttpServer()).patch('/profile').expect(HttpStatus.UNAUTHORIZED);
    });

    it('should not be able to update the user profile with an invalid body', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                await request(app.getHttpServer())
                    .patch('/profile')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .send({ height: true })
                    .expect(HttpStatus.BAD_REQUEST);
            });
    });

    it('should be able to update the user profile if authenticated', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                await request(app.getHttpServer())
                    .patch('/profile')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .send({ isMenstrualCycleRegular: false })
                    .expect(HttpStatus.OK);

                await request(app.getHttpServer())
                    .get('/profile')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .expect(HttpStatus.OK)
                    .expect((res) => {
                        expect(res.body.isMenstrualCycleRegular).toBe(false);
                    });
            });
    });
});
