import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GoogleUserInfo {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  at_hash: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
  iat: string;
  exp: string;
}

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);

  constructor(private readonly configService: ConfigService) {}

  async verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      // Verify with Google's OAuth2 tokeninfo endpoint
      const { data } = await axios.get<GoogleUserInfo>(
        'https://oauth2.googleapis.com/tokeninfo',
        { params: { id_token: idToken } },
      );

      // Verify the audience matches our OAuth client
      const expectedAudience = this.configService.get<string>(
        'firebase.webClientId',
      );
      const iosAudience = this.configService.get<string>(
        'firebase.iosClientId',
      );

      // For mobile, we accept tokens from both web and iOS clients
      if (data.aud !== expectedAudience && data.aud !== iosAudience) {
        this.logger.warn(
          `Token audience mismatch: expected ${expectedAudience} or ${iosAudience}, got ${data.aud}`,
        );
      }

      this.logger.log(`Google token verified for user: ${data.email}`);
      return data;
    } catch (error) {
      this.logger.error('Failed to verify Google token', error);
      throw new Error('Invalid Google token');
    }
  }
}
