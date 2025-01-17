import { Injectable } from '@nestjs/common';
import { parseISO } from 'date-fns';
import { DateTime } from 'luxon';
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
        return this.menstrualPeriodRepository.getMenstrualPeriods(userId, year, month);
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
        //TODO: add validation to not allow duplicated dates for the same user.

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

    async resolveCycleDuration(
        userMenstrualCycleDuration: number | null,
        menstrualPerioDates: Date[],
    ) {
        const defaultCycle = 28;
        const menstrualCycleDuration = userMenstrualCycleDuration ?? defaultCycle;

        if (menstrualPerioDates.length === 1) {
            return menstrualCycleDuration;
        }

        if (menstrualPerioDates.length === 2) {
            const fistDate = DateTime.fromISO(menstrualPerioDates[0].toString());
            const secondDate = DateTime.fromISO(menstrualPerioDates[1].toString());

            const differenceDate = fistDate.diff(secondDate, ['days']);
            return (differenceDate.days + menstrualCycleDuration + menstrualCycleDuration) / 3;
        }

        if (menstrualPerioDates.length === 3) {
            const fistDate = DateTime.fromISO(menstrualPerioDates[0].toString());
            const secondDate = DateTime.fromISO(menstrualPerioDates[1].toString());
            const thirdDate = DateTime.fromISO(menstrualPerioDates[2].toString());

            const differenceDateFirst = fistDate.diff(secondDate, ['days']);
            const differenceDateSecond = secondDate.diff(thirdDate, ['days']);

            return (
                (differenceDateFirst.days + differenceDateSecond.days + menstrualCycleDuration) / 3
            );
        }
        const fistDate = DateTime.fromISO(menstrualPerioDates[0].toString());
        const secondDate = DateTime.fromISO(menstrualPerioDates[1].toString());
        const thirdDate = DateTime.fromISO(menstrualPerioDates[2].toString());
        const fourthDate = DateTime.fromISO(menstrualPerioDates[3].toString());

        const differenceDateFirst = fistDate.diff(secondDate, ['days']);
        const differenceDateSecond = secondDate.diff(thirdDate, ['days']);
        const differenceDateThird = thirdDate.diff(fourthDate, ['days']);

        return (
            (differenceDateFirst.days + differenceDateSecond.days + differenceDateThird.days) / 3
        );
    }

    async getMenstrualPeriods(userId: number) {
        return await this.menstrualPeriodRepository.find({
            where: {
                userId: userId,
            },
            order: {
                startedAt: 'DESC',
            },
            take: 4,
        });
    }

    async getForecasting(userId: number) {
        const userProfile = await this.profileRepository.find({ where: { userId: userId } });
        const menstrualPeriods = await this.getMenstrualPeriods(userId);
        const startedAtCollection = menstrualPeriods.map((menstrualPeriodInteration) => {
            return menstrualPeriodInteration.startedAt;
        });

        if (startedAtCollection.length === 0 && userProfile[0].initialPeriodDate === null) {
            throw new CustomNotFoundException({
                code: 'not-enough-data',
                message: 'There is not enough data to forecast the next menstrual periods',
            });
        }

        if (startedAtCollection.length < 4 && userProfile[0].initialPeriodDate !== null) {
            startedAtCollection.push(userProfile[0].initialPeriodDate);
        }

        const durationCycle = Math.floor(
            await this.resolveCycleDuration(
                userProfile[0].menstrualCycleDuration,
                startedAtCollection,
            ),
        );

        const datesForescastingOfYear = [];

        for (let i = 1; i < 13; i++) {
            datesForescastingOfYear.push(
                DateTime.fromISO(startedAtCollection[0].toString())
                    .plus({ days: durationCycle * i })
                    .toFormat('yyyy-MM-dd'),
            );
        }

        return {
            events: {
                menstrualPeriods: {
                    days: datesForescastingOfYear,
                },
            },
        };
    }
}
