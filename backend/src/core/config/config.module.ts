import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envSchema } from './env.schema';
import {
  appConfig,
  jwtConfig,
  redisConfig,
  throttleConfig,
  storageConfig,
  mailConfig,
} from './config.namespaces';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        jwtConfig,
        redisConfig,
        throttleConfig,
        storageConfig,
        mailConfig,
      ],
      validate: (config) => {
        const parsed = envSchema.safeParse(config);
        if (!parsed.success) {
          const errors = parsed.error.issues
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join('\n');
          throw new Error(`Environment validation failed:\n${errors}`);
        }
        return parsed.data;
      },
    }),
  ],
})
export class ConfigModule {}
