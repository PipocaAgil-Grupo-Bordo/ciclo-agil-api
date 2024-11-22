import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcrypt';
import { DateTime } from 'luxon';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { User } from '../user/entities/user.entity';
import { MenstrualPeriodDate } from './entities/menstrual-period-date.entity';
import { MenstrualPeriodModule } from './menstrual-period.module';

describe('MenstrualPeriodController', () => {
    let app: INestApplication;
    let dataSource: DataSource;

    const testUser = {
        name: 'testuser',
        password: 'testpassword',
        email: 'testuser@example.com',
        birthday: '25/12/1995',
    };

    const cleanDatabase = async () => {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.query('SET CONSTRAINTS ALL DEFERRED');
            await queryRunner.query('TRUNCATE TABLE "menstrual_period" CASCADE');
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

            await queryRunner.manager.save(User, {
                ...testUser,
                password: hashedPassword,
            });

            await queryRunner.manager.save(User, {
                ...testUser,
                password: hashedPassword,
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
                MenstrualPeriodModule,
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

    it('should not be able to get the last menstrual periods without authentication', async () => {
        await request(app.getHttpServer())
            .get('/menstrual-period/last')
            .expect(HttpStatus.UNAUTHORIZED);
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
                        .send({ date: '2024-06-20' })
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

    describe('aaa', () => {
        beforeEach(async () => {
            const queryRunner = dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                const now = DateTime.now();
                const cycleDuration = 28;

                for (let i = 0; i < 12; i++) {
                    await queryRunner.manager.save(MenstrualPeriodDate, {
                        date: now.plus({ days: cycleDuration * i }).toFormat('yyyy-MM-dd'),
                    });
                }

                await queryRunner.commitTransaction();
            } catch (err) {
                await queryRunner.rollbackTransaction();
                throw err;
            } finally {
                await queryRunner.release();
            }
        });

        it('should be able to predict the next 12 menstrual periods if authenticated', async () => {
            console.log('Second');
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
                        .expect(HttpStatus.OK)
                        .expect((res) => {
                            const now = DateTime.now();
                            const cycleDuration = 28;
                            expect(res.body).toBe({
                                events: {
                                    menstrualPeriod: {
                                        periodDuration: 5,
                                        initialDates: [
                                            now.toFormat('yyyy-MM-dd'),
                                            now
                                                .plus({ days: cycleDuration })
                                                .toFormat('yyyy-MM-dd'),
                                            now
                                                .plus({ days: cycleDuration * 2 })
                                                .toFormat('yyyy-MM-dd'),
                                            now
                                                .plus({ days: cycleDuration * 3 })
                                                .toFormat('yyyy-MM-dd'),
                                            now
                                                .plus({ days: cycleDuration * 4 })
                                                .toFormat('yyyy-MM-dd'),
                                            now
                                                .plus({ days: cycleDuration * 5 })
                                                .toFormat('yyyy-MM-dd'),
                                            now
                                                .plus({ days: cycleDuration * 6 })
                                                .toFormat('yyyy-MM-dd'),
                                            now
                                                .plus({ days: cycleDuration * 7 })
                                                .toFormat('yyyy-MM-dd'),
                                            now
                                                .plus({ days: cycleDuration * 8 })
                                                .toFormat('yyyy-MM-dd'),
                                            now
                                                .plus({ days: cycleDuration * 9 })
                                                .toFormat('yyyy-MM-dd'),
                                            now
                                                .plus({ days: cycleDuration * 10 })
                                                .toFormat('yyyy-MM-dd'),
                                            now
                                                .plus({ days: cycleDuration * 11 })
                                                .toFormat('yyyy-MM-dd'),
                                        ],
                                    },
                                },
                            });
                        });
                });
        });
    });

    it('should not be able to get menstrual periods without authentication', async () => {
        await request(app.getHttpServer()).get('/menstrual-period').expect(HttpStatus.UNAUTHORIZED);
    });

    // it('should be able to get menstrual periods if authenticated', async () => {
    //     await request(app.getHttpServer())
    //         .post('/auth/login')
    //         .send({
    //             password: testUser.password,
    //             email: testUser.email,
    //         })
    //         .expect(HttpStatus.CREATED)
    //         .then(
    //             async (result) => {
    //                 await request(app.getHttpServer())
    //                 .get('/menstrual-period')
    //                 .set('Authorization', `Bearer ${result.body.token.accessToken}`)
    //                 .expect(HttpStatus.OK)
    //                 .expect((res) => {
    //                     expect(Array.isArray(res.body)).toBe(true);
    //                 })
    //             }
    //         );
    // });

    // it('should be able to get the menstrual periods of a specific month', async () => {
    //     await request(app.getHttpServer())
    //         .post('/auth/login')
    //         .send({
    //             password: testUser.password,
    //             email: testUser.email,
    //         })
    //         .expect(HttpStatus.CREATED)
    //         .then(
    //             async (result) => {
    //                 const firstDate = "2023-06-20";
    //                 const secondDate = "2024-05-20";

    //                 await request(app.getHttpServer())
    //                 .post('/menstrual-period/date')
    //                 .set('Authorization', `Bearer ${result.body.token.accessToken}`)
    //                 .send({date: firstDate})
    //                 .expect(HttpStatus.CREATED);

    //                 await request(app.getHttpServer())
    //                 .post('/menstrual-period/date')
    //                 .set('Authorization', `Bearer ${result.body.token.accessToken}`)
    //                 .send({date: secondDate})
    //                 .expect(HttpStatus.CREATED);

    //                 await request(app.getHttpServer())
    //                 .get('/menstrual-period?year=2023&month=06')
    //                 .set('Authorization', `Bearer ${result.body.token.accessToken}`)
    //                 .expect(HttpStatus.OK)
    //                 .expect((res) => {
    //                     expect(Array.isArray(res.body)).toBe(true);
    //                     expect(res.body[0].startedAt).toBe(firstDate)
    //                 })
    //             }
    //         );
    // });

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
