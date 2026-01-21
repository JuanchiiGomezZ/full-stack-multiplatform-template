import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty({ message: 'ID token is required' })
  idToken: string;

  @IsOptional()
  @IsString()
  accessToken?: string;
}
