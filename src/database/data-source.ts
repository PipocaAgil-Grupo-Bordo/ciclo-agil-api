import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: envFile });

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    url: process.env.POSTGRES_URL,
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/database/migrations/*.js'],
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
