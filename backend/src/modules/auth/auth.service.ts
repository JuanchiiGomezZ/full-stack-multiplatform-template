import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/database/prisma.service';
import { FirebaseAdminService } from './lib/firebase-admin';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly firebaseAdmin: FirebaseAdminService,
  ) {}

  async loginWithGoogle(idToken: string) {
    // 1. Verify token with Google OAuth2
    const googleUser = await this.firebaseAdmin.verifyGoogleToken(idToken);

    if (!googleUser.email) {
      throw new UnauthorizedException('Email not provided by Google');
    }

    // 2. Find or create user
    const user = await this.prisma.user.upsert({
      where: { email: googleUser.email },
      create: {
        email: googleUser.email,
        provider: 'google',
        providerId: googleUser.sub,
        firstName: googleUser.given_name || null,
        lastName: googleUser.family_name || null,
        avatarUrl: googleUser.picture || null,
      },
      update: {
        providerId: googleUser.sub,
        avatarUrl: googleUser.picture || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        hasCompletedOnboarding: true,
        createdAt: true,
      },
    });

    // 3. Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user,
      ...tokens,
    };
  }

  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        provider: 'email',
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        hasCompletedOnboarding: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user,
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
      select: {
        id: true,
        email: true,
        password: true,
        provider: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        hasCompletedOnboarding: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.provider !== 'email') {
      throw new UnauthorizedException('Please use OAuth to sign in');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        hasCompletedOnboarding: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async completeOnboarding(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { hasCompletedOnboarding: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        hasCompletedOnboarding: true,
      },
    });

    return user;
  }

  async refreshTokens(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const { user } = storedToken;
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return tokens;
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const secret = this.configService.get<string>('jwt.secret');
    const expiresInStr =
      this.configService.get<string>('jwt.expiresIn') || '15m';
    const expiresIn = this.parseExpiryToSeconds(expiresInStr);

    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });

    const refreshToken = uuidv4();
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const expiresAt = new Date();
    const refreshSeconds = this.parseExpiryToSeconds(refreshExpiresIn);
    expiresAt.setSeconds(expiresAt.getSeconds() + refreshSeconds);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([dhms])$/);
    if (!match) return 900;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return value * 86400;
      case 'h':
        return value * 3600;
      case 'm':
        return value * 60;
      case 's':
        return value;
      default:
        return 900;
    }
  }
}
