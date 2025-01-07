import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcrypt';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { User } from '../user/entities/user.entity';
import { VerificationCodeModule } from '../verification-code/verification-code.module';
import { VerificationCodeService } from '../verification-code/verification-code.service';

describe('AuthController', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let verificationCodeService: VerificationCodeService;

    const testUser = {
        name: 'testuser',
        password: 'testpassword',
        email: 'teste@gmail.com',
        birthday: '25/12/1995',
    };

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
                DatabaseModule,
                AuthModule,
                VerificationCodeModule,
            ],
        }).compile();

        app = testingModule.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());

        dataSource = testingModule.get<DataSource>(DataSource);
        verificationCodeService =
            testingModule.get<VerificationCodeService>(VerificationCodeService);

        await seedDatabase();
        await app.init();
    });

    afterAll(async () => {
        await cleanDatabase();
        await app.close();
    });

    it('should not be able to login with empty fields', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: undefined,
                email: undefined,
            })
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('should not be able to login with empty passaword or email', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: undefined,
                email: testUser.email,
            })
            .expect(HttpStatus.BAD_REQUEST);

        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: undefined,
            })
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('should be able to login ', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED);
    });

    it('should not be able to see whoami', async () => {
        await request(app.getHttpServer()).get('/auth/whoami').expect(HttpStatus.UNAUTHORIZED);
    });

    it('should be able to see whoami', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                const periodUser = (
                    await request(app.getHttpServer())
                        .get('/auth/whoami')
                        .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                        .expect(HttpStatus.OK)
                ).body.user;

                await request(app.getHttpServer())
                    .get('/auth/whoami')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .expect(HttpStatus.OK)
                    .expect((res) => {
                        expect(res.body.user).toBe(periodUser);
                    });
            });
    });

    it('should not be reset password with password undefined', async () => {
        await request(app.getHttpServer())
            .patch('/auth/reset-password')
            .send({
                password: null,
            })
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should not be reset password without being logged in', async () => {
        await request(app.getHttpServer())
            .patch('/auth/reset-password')
            .send({
                password: 'testtfd',
            })
            .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should no be reset in reason by same password', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                await request(app.getHttpServer())
                    .patch('/auth/reset-password')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .send({
                        password: testUser.password,
                    })
                    .expect(HttpStatus.BAD_REQUEST);
            });
    });

    it('should not be reset password', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                await request(app.getHttpServer())
                    .patch('/auth/reset-password')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .send({
                        password: 'testtfd',
                    })
                    .expect(HttpStatus.BAD_REQUEST);

                await request(app.getHttpServer())
                    .patch('/auth/reset-password')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .send({
                        password: 'Tappqwpa',
                    })
                    .expect(HttpStatus.BAD_REQUEST);

                await request(app.getHttpServer())
                    .patch('/auth/reset-password')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .send({
                        password: 'Tappp11pa',
                    })
                    .expect(HttpStatus.BAD_REQUEST);

                await request(app.getHttpServer())
                    .patch('/auth/reset-password')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .send({
                        password: 'Tapp_aspa',
                    })
                    .expect(HttpStatus.BAD_REQUEST);
            });
    });

    it('should not be reset with email undefined', async () => {
        await request(app.getHttpServer())
            .post('/auth/reset-password/request')
            .send({
                email: undefined,
            })
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('should not be able to send the email with another email not registered', async () => {
        await request(app.getHttpServer())
            .post('/auth/reset-password/request')
            .send({
                email: 'test2@gmail.com',
            })
            .expect(HttpStatus.NOT_FOUND);
    });

    it('should be able to send the email', async () => {
        await request(app.getHttpServer())
            .post('/auth/reset-password/request')
            .send({
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED);
    });

    it('should validate the code sent by email', async () => {
        await request(app.getHttpServer())
            .post('/auth/reset-password/request')
            .send({
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async () => {
                const verificationCode = await verificationCodeService.generate();
                await verificationCodeService.insert(verificationCode, testUser.email);

                await request(app.getHttpServer())
                    .post('/auth/reset-password/validate')
                    .send({
                        email: testUser.email,
                        code: verificationCode,
                    })
                    .expect(HttpStatus.CREATED);
            });
    });

    it('should not validate the code by email undefined', async () => {
        await request(app.getHttpServer())
            .post('/auth/reset-password/request')
            .send({
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async () => {
                const verificationCode = await verificationCodeService.generate();
                await verificationCodeService.insert(verificationCode, testUser.email);

                await request(app.getHttpServer())
                    .post('/auth/reset-password/validate')
                    .send({
                        email: undefined,
                        code: verificationCode,
                    })
                    .expect(HttpStatus.BAD_REQUEST);
            });
    });

    it('should not validate the code be undefined', async () => {
        await request(app.getHttpServer())
            .post('/auth/reset-password/request')
            .send({
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async () => {
                const verificationCode = await verificationCodeService.generate();
                await verificationCodeService.insert(verificationCode, testUser.email);

                await request(app.getHttpServer())
                    .post('/auth/reset-password/validate')
                    .send({
                        email: testUser.email,
                        code: undefined,
                    })
                    .expect(HttpStatus.BAD_REQUEST);
            });
    });

    it('should refresh token', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                await new Promise((resolve) => setTimeout(resolve, 3000));
                await request(app.getHttpServer())
                    .post('/auth/refresh-token')
                    .send({
                        refreshToken: result.body.token.refreshToken,
                    })
                    .expect(HttpStatus.CREATED)
                    .then((res) => {
                        expect(res.body.accessToken).not.toBe(result.body.token.accessToken);
                    });
            });
    });

    it('should be reset password', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                password: testUser.password,
                email: testUser.email,
            })
            .expect(HttpStatus.CREATED)
            .then(async (result) => {
                await request(app.getHttpServer())
                    .patch('/auth/reset-password')
                    .set('Authorization', `Bearer ${result.body.token.accessToken}`)
                    .send({
                        password: 'Ta_123ads',
                    })
                    .expect(HttpStatus.OK);
            });
    });
});
