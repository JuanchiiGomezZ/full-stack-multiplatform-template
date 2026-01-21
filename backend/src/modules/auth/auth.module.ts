import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { FirebaseAdminService } from './lib/firebase-admin';
import { DatabaseModule } from '../../core/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('jwt.secret');
        const expiresInStr = configService.get<string>('jwt.expiresIn') || '15m';
        // Parse to seconds for JWT signOptions
        const match = expiresInStr.match(/^(\d+)([dhms])$/);
        let expiresIn: number | String = 900;
        if (match) {
          const value = parseInt(match[1], 10);
          const unit = match[2];
          switch (unit) {
            case 'd': expiresIn = value * 86400; break;
            case 'h': expiresIn = value * 3600; break;
            case 'm': expiresIn = value * 60; break;
            case 's': expiresIn = value; break;
          }
        }
        return {
          secret,
          signOptions: { expiresIn: expiresIn as number },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, FirebaseAdminService],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
