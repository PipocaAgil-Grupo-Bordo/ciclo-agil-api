import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const databaseConfig = async (
    configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
    return {
        type: 'postgres',
        url: configService.get<string>('POSTGRES_URL'),
        autoLoadEntities: true,
        migrations: [
            /*...*/
        ],
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false,
    };
};
