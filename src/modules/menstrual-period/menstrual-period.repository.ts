import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { MenstrualPeriod } from './entities/menstrual-period.entity';

@Injectable()
export class MenstrualPeriodRepository extends Repository<MenstrualPeriod> {
    constructor(private dataSource: DataSource) {
        super(MenstrualPeriod, dataSource.createEntityManager());
    }

    async getMenstrualPeriods(
        userId: number,
        year?: string,
        month?: string,
    ): Promise<MenstrualPeriod[]> {
        if (!year) {
            const thirtyYearsAgo = new Date();
            thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);

            return this.createQueryBuilder('menstrual_period')
                .leftJoinAndSelect('menstrual_period.dates', 'dates')
                .where('menstrual_period.userId = :userId', { userId })
                .andWhere('menstrual_period.startedAt >= :thirtyYearsAgo', {
                    thirtyYearsAgo,
                })
                .orderBy('menstrual_period.startedAt', 'ASC')
                .addOrderBy('dates.date', 'ASC')
                .getMany();
        }

        if (month && year) {
            return this.createQueryBuilder('menstrual_period')
                .leftJoinAndSelect('menstrual_period.dates', 'dates')
                .where('menstrual_period.userId = :userId', { userId })
                .andWhere(
                    '((EXTRACT(YEAR FROM menstrual_period.startedAt) = :year AND EXTRACT(MONTH FROM menstrual_period.startedAt) = :month) OR (EXTRACT(YEAR FROM menstrual_period.lastDate) = :year AND EXTRACT(MONTH FROM menstrual_period.lastDate) = :month))',
                    { year, month },
                )
                .orderBy('menstrual_period.startedAt', 'ASC')
                .addOrderBy('dates.date', 'ASC')
                .getMany();
        }

        return this.createQueryBuilder('menstrual_period')
            .leftJoinAndSelect('menstrual_period.dates', 'dates')
            .where('menstrual_period.userId = :userId', { userId })
            .andWhere(
                '(EXTRACT(YEAR FROM menstrual_period.startedAt) = :year OR EXTRACT(YEAR FROM menstrual_period.lastDate) = :year)',
                { year },
            )
            .orderBy('menstrual_period.startedAt', 'ASC')
            .addOrderBy('dates.date', 'ASC')
            .getMany();
    }

    async getLastMenstrualPeriod(userId: number): Promise<MenstrualPeriod | undefined> {
        return this.createQueryBuilder('menstrual_period')
            .where('menstrual_period.userId = :userId', { userId })
            .orderBy('menstrual_period.startedAt', 'DESC')
            .getOne();
    }

    findClosestPeriod(
        date: string,
        userId: number,
        direction: 'past' | 'future' = 'past',
    ): Promise<MenstrualPeriod | undefined> {
        const comparingDate = new Date(date);

        if (direction === 'past') {
            return this.createQueryBuilder('menstrual_period')
                .where('menstrual_period.userId = :userId', { userId })
                .andWhere('menstrual_period.lastDate <= :comparingDate', { comparingDate })
                .orderBy('menstrual_period.lastDate', 'DESC')
                .getOne();
        }

        if (direction === 'future') {
            return this.createQueryBuilder('menstrual_period')
                .where('menstrual_period.userId = :userId', { userId })
                .andWhere('menstrual_period.startedAt >= :comparingDate', { comparingDate })
                .orderBy('menstrual_period.lastDate', 'ASC')
                .getOne();
        }
    }

    async findPeriodCoveringDate(
        date: string,
        userId: number,
    ): Promise<MenstrualPeriod | undefined> {
        const comparingDate = new Date(date);

        return this.createQueryBuilder('menstrual_period')
            .where('menstrual_period.userId = :userId', { userId })
            .andWhere('menstrual_period.startedAt <= :comparingDate', { comparingDate })
            .andWhere('menstrual_period.lastDate >= :comparingDate', { comparingDate })
            .getOne();
    }
}
