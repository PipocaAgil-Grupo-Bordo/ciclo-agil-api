import { Injectable } from '@nestjs/common';
import { parseISO } from 'date-fns';
import {
    CustomConflictException,
    CustomForbiddenException,
    CustomNotFoundException,
} from '../../shared/exceptions/http-exception';
import { ProfileRepository } from '../profile/profile.repository';
import { CreateMenstrualPeriodDateDto } from './dtos/create-menstrual-date.dto';
import { CreateMenstrualPeriodDto } from './dtos/create-menstrual-period.dto';
import { MenstrualPeriod } from './entities/menstrual-period.entity';
import { MenstrualPeriodDateRepository } from './menstrual-period-date.repository';
import { MenstrualPeriodRepository } from './menstrual-period.repository';

@Injectable()
export class MenstrualPeriodService {
    constructor(
        private menstrualPeriodRepository: MenstrualPeriodRepository,
        private menstrualPeriodDateRepository: MenstrualPeriodDateRepository,
        private profileRepository: ProfileRepository,
    ) {}

    async create(body: CreateMenstrualPeriodDto, userId: number) {
        const menstrualPeriod = { ...body, userId };
        return this.menstrualPeriodRepository.save(menstrualPeriod);
    }

    async getByDate(userId: number, year?: string, month?: string) {
        return {
            period: await this.menstrualPeriodRepository.getMenstrualPeriods(userId, year, month),
        };
    }

    async getLastByUserId(userId: number): Promise<MenstrualPeriod | undefined> {
        const lastPeriod = await this.menstrualPeriodRepository.getLastMenstrualPeriod(userId);
        if (!lastPeriod) {
            throw new CustomNotFoundException({
                code: 'not-found',
                message: 'No menstrual period found for this user',
            });
        }
        return lastPeriod;
    }

    async createDate(body: CreateMenstrualPeriodDateDto, userId: number) {
        let shouldCreateMenstrualPeriod = false;
        let menstrualPeriodId: number;
        const bodyDate = parseISO(body.date);

        const coveringPeriod = await this.menstrualPeriodRepository.findPeriodCoveringDate(
            bodyDate.toISOString(),
            userId,
        );

        if (coveringPeriod) {
            menstrualPeriodId = coveringPeriod.id;

            return this.menstrualPeriodDateRepository.insertDate({
                ...body,
                menstrualPeriodId,
                date: body.date,
            });
        }

        const closestPreviousPeriod = await this.menstrualPeriodRepository.findClosestPeriod(
            bodyDate.toISOString(),
            userId,
        );

        const nextPeriod = await this.menstrualPeriodRepository.findClosestPeriod(
            bodyDate.toISOString(),
            userId,
            'future',
        );

        let daysUntillNextPeriod: number;

        if (nextPeriod) {
            const nextPeriodDate = this.toLocalDate(new Date(nextPeriod.startedAt));

            const differenceInTime = nextPeriodDate.getTime() - bodyDate.getTime();
            daysUntillNextPeriod = differenceInTime / (1000 * 3600 * 24);

            if (daysUntillNextPeriod <= 3) {
                shouldCreateMenstrualPeriod = false;
                menstrualPeriodId = nextPeriod.id;

                return this.menstrualPeriodDateRepository.insertDate({
                    ...body,
                    menstrualPeriodId,
                    date: body.date,
                });
            }
        }

        if (!nextPeriod || daysUntillNextPeriod > 3) {
            if (!closestPreviousPeriod) {
                shouldCreateMenstrualPeriod = true;
            } else {
                menstrualPeriodId = closestPreviousPeriod.id;

                const closestPeriodDate = this.toLocalDate(
                    new Date(closestPreviousPeriod.lastDate),
                );

                const differenceInTime = bodyDate.getTime() - closestPeriodDate.getTime();
                const differenceInDays = differenceInTime / (1000 * 3600 * 24);

                if (differenceInDays > 3) {
                    shouldCreateMenstrualPeriod = true;
                }
            }

            if (shouldCreateMenstrualPeriod) {
                const newPeriod = await this.menstrualPeriodRepository.save({
                    startedAt: bodyDate,
                    lastDate: bodyDate,
                    userId,
                });

                menstrualPeriodId = newPeriod.id;
            }

            const existingDate = await this.menstrualPeriodDateRepository.findByPeriodIdAndDate(
                menstrualPeriodId,
                bodyDate,
            );

            if (existingDate) {
                throw new CustomConflictException({
                    code: 'date-already-added',
                    message: 'This date was already added.',
                });
            }

            return this.menstrualPeriodDateRepository.insertDate({
                ...body,
                menstrualPeriodId,
                date: body.date,
            });
        }
    }

    toLocalDate(date: Date) {
        return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    }


    differenceDate(dateFirst: MenstrualPeriod, dateSecond: MenstrualPeriod) {
        const date1 = new Date(dateFirst.startedAt);
        const date2 = new Date(dateSecond.startedAt);
        const timeDiff = Math.abs(date2.getTime() - date1.getTime());
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return diffDays;
    }

    async deleteDate(id: number, userId: number) {
        const existsDate = await this.menstrualPeriodDateRepository.findOneBy({
            id,
        });
        if (!existsDate) {
            throw new CustomNotFoundException({
                code: 'date-does-not-exist',
                message: 'This date does not exist',
            });
        }

        const dateBelongsToUser = await this.menstrualPeriodRepository.findOneBy({
            id: existsDate.menstrualPeriodId,
            userId,
        });

        if (!dateBelongsToUser) {
            throw new CustomForbiddenException({
                code: 'date-does-not-belong-to-user',
                message: 'User does not have permission to delete this date',
            });
        }

        await this.menstrualPeriodDateRepository.delete({ id });

        return {
            code: 'success',
        };
    }

    async getForecasting(userId: number) {
        
        return {userId}
        // const regularMenstrual = await this.profileRepository.findBy({ id: id });
        // if (regularMenstrual[0]?.isMenstrualCycleRegular) {
        //     if (regularMenstrual[0].menstrualCycleDuration == null) {
        //         const getMenstrualDatePeriod = await this.menstrualPeriodRepository.find();
        //         const predict: Date = new Date(
        //             getMenstrualDatePeriod[getMenstrualDatePeriod.length - 1].startedAt,
        //         );
        //         predict.setDate(predict.getDate() + 28);
        //         return predict.toISOString().split('T')[0];
        //     }
        //     const getMenstrualDatePeriod = await this.menstrualPeriodRepository.find();
        //     const predict: Date = new Date(
        //         getMenstrualDatePeriod[getMenstrualDatePeriod.length - 1].startedAt,
        //     );
        //     predict.setDate(predict.getDate() + regularMenstrual[0].menstrualCycleDuration);
        //     return predict.toISOString().split('T')[0];
        // } else {
        //     const getMenstrualDatePeriod = await this.menstrualPeriodRepository.find({where: {userId: }});
        //     if (getMenstrualDatePeriod.length < 2) {
        //         throw new CustomNotFoundException({
        //             code: 'not-data',
        //             message: 'not there is data enough',
        //         });
        //     }

        //     const cycle1 = this.differenceDate(
        //         getMenstrualDatePeriod[getMenstrualDatePeriod.length - 4],
        //         getMenstrualDatePeriod[getMenstrualDatePeriod.length - 3],
        //     );
        //     const cycle2 = this.differenceDate(
        //         getMenstrualDatePeriod[getMenstrualDatePeriod.length - 3],
        //         getMenstrualDatePeriod[getMenstrualDatePeriod.length - 2],
        //     );
        //     const cycle3 = this.differenceDate(
        //         getMenstrualDatePeriod[getMenstrualDatePeriod.length - 2],
        //         getMenstrualDatePeriod[getMenstrualDatePeriod.length - 1],
        //     );
        //     const predict: Date = new Date(
        //         getMenstrualDatePeriod[getMenstrualDatePeriod.length - 1].startedAt,
        //     );

        //     const avaregeDaysCycle = (cycle1 + cycle2 + cycle3) / 3;
        //     predict.setDate(predict.getDate() + Math.ceil(avaregeDaysCycle));
        //     return predict.toISOString().split('T')[0];
        // }
    }
}
