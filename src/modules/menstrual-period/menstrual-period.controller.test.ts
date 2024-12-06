import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcrypt';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { Profile } from '../profile/entities/profile.entity';
import { ProfileModule } from '../profile/profile.module';
import { User } from '../user/entities/user.entity';
import { MenstrualPeriodModule } from './menstrual-period.module';

describe('MenstrualPeriodController', () => {
    let app: INestApplication;
    let dataSource: DataSource;

    const now = DateTime.now();

    const testUser = {
        name: 'testuser',
        password: 'testpassword',
        email: 'testuser@example.com',
        birthday: '25/12/1995',
    };
    let userResponse: User;

    const cleanDatabase = async () => {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.query('SET CONSTRAINTS ALL DEFERRED');
            await queryRunner.query('TRUNCATE TABLE "menstrual_period" CASCADE');
<<<<<<< HEAD
=======
            await queryRunner.query('TRUNCATE TABLE "profile" CASCADE');
>>>>>>> 4a994b9 (integration test for cia-262)
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

            userResponse = await queryRunner.manager.save(User, {
                ...testUser,
                password: hashedPassword,
            });

<<<<<<< HEAD
=======
            await queryRunner.manager.save(Profile, {
                userId: userResponse.id,
                initialPeriodDate: null,
            });

>>>>>>> 4a994b9 (integration test for cia-262)
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
                MenstrualPeriodModule,
                DatabaseModule,
                AuthModule,
                ProfileModule,
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

    it('should not be able to get the last menstrual periods without authentication', async () => {
        await request(app.getHttpServer())
            .get('/menstrual-period/last')
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should give not found when no menstrual periods exist and initial period date', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                await request(app.getHttpServer())
                    .get('/menstrual-period/forecasting')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .expect(HttpStatus.NOT_FOUND);
            });
    });

    it('should be able to get the last menstrual period if authenticated', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                const periodId = (
                    await request(app.getHttpServer())
                        .post('/menstrual-period/date')
                        .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                        .send({ date: now.toFormat('yyyy-MM-dd') })
                        .expect(HttpStatus.CREATED)
                ).body.menstrualPeriodId;

                await request(app.getHttpServer())
                    .get('/menstrual-period/last')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .expect(HttpStatus.OK)
                    .expect((res) => {
                        expect(res.body.id).toBe(periodId);
                    });
            });
    });

<<<<<<< HEAD
=======
    describe('forecasting menstrual period', () => {
        /* beforeEach(async () => {
            const queryRunner = dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                const now = DateTime.now();
                const menstrualPeriod = await queryRunner.manager.save(MenstrualPeriod, {
                    startedAt: now.toFormat('yyyy-MM-dd'),
                    lastDate: now.toFormat('yyyy-MM-dd'),
                    userId: userResponse.id,
                });

                await queryRunner.manager.save(MenstrualPeriodDate, {
                    date: now.toFormat('yyyy-MM-dd'),
                    menstrualPeriodId: menstrualPeriod.id,
                });

                await queryRunner.commitTransaction();
            } catch (err) {
                await queryRunner.rollbackTransaction();
                throw err;
            } finally {
                await queryRunner.release();
            }
        });*/

        it('should be able to predict the next 12 menstrual periods if authenticated', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    password: testUser.password,
                    email: testUser.email,
                })
                .expect(HttpStatus.CREATED)
                .then(async (result) => {
                    const defaultCycle = 28;
                    const now = DateTime.now();
                    const mockDatesOFYear = [];
                    for (let i = 0; i < 12; i++) {
                        mockDatesOFYear.push(
                            now.plus({ days: defaultCycle * i }).toFormat('yyyy-MM-dd'),
                        );
                    }
                    const mockResult = {
                        events: {
                            menstrualPeriods: {
                                days: mockDatesOFYear,
                            },
                        },
                    };
                    await request(app.getHttpServer())
                        .get('/menstrual-period/forecasting')
                        .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                        .expect((res) => {
                            expect(res.body).toEqual(mockResult);
                        });
                });
        });
    });

>>>>>>> 4a994b9 (integration test for cia-262)
    it('should not be able to get menstrual periods without authentication', async () => {
        await request(app.getHttpServer()).get('/menstrual-period').expect(HttpStatus.UNAUTHORIZED);
    });

    it('should be able to get menstrual periods if authenticated', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                await request(app.getHttpServer())
                    .get('/menstrual-period')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .expect(HttpStatus.OK)
                    .expect((res) => {
                        expect(Array.isArray(res.body)).toBe(true);
                    });
            });
    });

    it('should be able to get the menstrual periods of a specific month', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                const firstDate = '2023-06-20';
                const secondDate = '2024-05-20';
<<<<<<< HEAD
=======
                await request(app.getHttpServer())
                    .post('/menstrual-period/date')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .send({ date: firstDate })
                    .expect(HttpStatus.CREATED);
>>>>>>> 4a994b9 (integration test for cia-262)

                await request(app.getHttpServer())
                    .post('/menstrual-period/date')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
<<<<<<< HEAD
                    .send({ date: firstDate })
                    .expect(HttpStatus.CREATED);

                await request(app.getHttpServer())
                    .post('/menstrual-period/date')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .send({ date: secondDate })
                    .expect(HttpStatus.CREATED);

                await request(app.getHttpServer())
=======
                    .send({ date: secondDate })
                    .expect(HttpStatus.CREATED);

                await request(app.getHttpServer())
>>>>>>> 4a994b9 (integration test for cia-262)
                    .get('/menstrual-period?year=2023&month=06')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .expect(HttpStatus.OK)
                    .expect((res) => {
                        expect(Array.isArray(res.body)).toBe(true);
                        expect(res.body[0].startedAt).toBe(firstDate);
                    });
            });
    });

    it('should create a new menstrual period if there is a gap of at least 3 days between the new date and the previous menstrual period', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                const firstDate = '2024-07-20';
                const secondDate = '2024-07-24';

                const firstPeriodId = (
                    await request(app.getHttpServer())
                        .post('/menstrual-period/date')
                        .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                        .send({ date: firstDate })
                        .expect(HttpStatus.CREATED)
                ).body.menstrualPeriodId;

                await request(app.getHttpServer())
                    .post('/menstrual-period/date')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .send({ date: secondDate })
                    .expect(HttpStatus.CREATED)
                    .expect((res) => {
                        expect(res.body.menstrualPeriodId).not.toBe(firstPeriodId);
                    });
            });
    });

    it('should NOT create a new menstrual period if there is a gap of 4 days or less between the new date and the previous menstrual period', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                const firstDate = '2024-08-20';
                const secondDate = '2024-08-23';

                const firstPeriodId = (
                    await request(app.getHttpServer())
                        .post('/menstrual-period/date')
                        .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                        .send({ date: firstDate })
                        .expect(HttpStatus.CREATED)
                ).body.menstrualPeriodId;

                await request(app.getHttpServer())
                    .post('/menstrual-period/date')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .send({ date: secondDate })
                    .expect(HttpStatus.CREATED)
                    .expect((res) => {
                        expect(res.body.menstrualPeriodId).toBe(firstPeriodId);
                    });
            });
    });

    it('should NOT create a future date', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 10);

                const date = futureDate.toISOString().split('T')[0];
                await request(app.getHttpServer())
                    .post('/menstrual-period/date')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .send({ date: date })
                    .expect(HttpStatus.BAD_REQUEST);
            });
    });
});
