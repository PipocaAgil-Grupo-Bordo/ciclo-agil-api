import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { CustomNotFoundException } from '../../shared/exceptions/http-exception';
import { MenstrualPeriodRepository } from '../menstrual-period/menstrual-period.repository';
import { ProfileRepository } from '../profile/profile.repository';

@Injectable()
export class MenstrualCycleService {
    constructor(
        private menstrualPeriodRepository: MenstrualPeriodRepository,
        private profileRepository: ProfileRepository,
    ) {}

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

        const upcomingPeriods = [];

        for (let i = 1; i < 13; i++) {
            upcomingPeriods.push(
                DateTime.fromISO(startedAtCollection[0].toString())
                    .plus({ days: durationCycle * i })
                    .toFormat('yyyy-MM-dd'),
            );
        }

        const upcomingOvulationDates = upcomingPeriods.map((date) => {
            return DateTime.fromISO(date).minus({ days: 14 }).toFormat('yyyy-MM-dd');
        });

        return {
            events: {
                menstrualPeriods: {
                    days: upcomingPeriods,
                },
                ovulationDates: {
                    days: upcomingOvulationDates,
                },
            },
        };
    }
}
