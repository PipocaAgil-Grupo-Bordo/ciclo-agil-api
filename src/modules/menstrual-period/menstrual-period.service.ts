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
        menstrualCycleDuration: number,
        menstrualPerioDates: Date[],
        isMenstrualCycleRegular: boolean,
    ) {
        const defaultCycle = 28;
        if (isMenstrualCycleRegular) {
            if (menstrualCycleDuration === null) {
                return defaultCycle;
            } else {
                return menstrualCycleDuration;
            }
        }
        if (menstrualPerioDates.length === 1) {
            throw new CustomNotFoundException({
                code: 'not-data-enough',
                message: 'not there is data enough',
            });
        }

        if (menstrualPerioDates.length === 2) {
            const fistDate = DateTime.fromISO(menstrualPerioDates[0].toString());
            const secondDate = DateTime.fromISO(menstrualPerioDates[1].toString());

            const differenceDate = fistDate.diff(secondDate);

            return (differenceDate.days + defaultCycle + defaultCycle) / 3;
        }

        if (menstrualPerioDates.length === 3) {
            const fistDate = DateTime.fromISO(menstrualPerioDates[0].toString());
            const secondDate = DateTime.fromISO(menstrualPerioDates[1].toString());
            const thirdDate = DateTime.fromISO(menstrualPerioDates[2].toString());

            const differenceDateFirst = fistDate.diff(secondDate, ['days']);
            const differenceDateSecond = secondDate.diff(thirdDate, ['days']);

            return (differenceDateFirst.days + differenceDateSecond.days + defaultCycle) / 3;
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

    async resolveGetDatesPeriodMenstrualDatabase(userId: number, isMenstrualCycleRegular: boolean) {
        if (isMenstrualCycleRegular) {
            return await this.menstrualPeriodRepository.find({
                where: {
                    userId: userId,
                },
                order: {
                    startedAt: 'DESC',
                },
                take: 1,
            });
        }
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
        const profileUser = await this.profileRepository.findBy({ id: userId });
        const menstrualPeriod = await this.resolveGetDatesPeriodMenstrualDatabase(
            userId,
            profileUser[0].isMenstrualCycleRegular,
        );
        const startedAtCollection = menstrualPeriod.map((menstrualPeriodInteration) => {
            return menstrualPeriodInteration.startedAt;
        });
        if (profileUser[0].initialPeriodDate === null && startedAtCollection.length === 0) {
            throw new CustomConflictException({
                code: 'initial-period-date',
                message: 'there is no date',
            });
        }

        if (startedAtCollection.length < 4 && profileUser[0].initialPeriodDate !== null) {
            startedAtCollection.push(profileUser[0].initialPeriodDate);
        }

        const durationCycle = Math.floor(
            await this.resolveCycleDuration(
                profileUser[0].menstrualCycleDuration,
                startedAtCollection,
                profileUser[0].isMenstrualCycleRegular,
            ),
        );

        const datesForescastingOfYear = [];

        for (let i = 0; i < 12; i++) {
            datesForescastingOfYear.push(
                DateTime.fromISO(startedAtCollection[0].toString())
                    .plus({ days: durationCycle * i })
                    .toFormat('yyyy-MM-dd'),
            );
        }

        return {
            events: {
                periodMenstrual: {
                    days: datesForescastingOfYear,
                },
            },
        };
    }
}
