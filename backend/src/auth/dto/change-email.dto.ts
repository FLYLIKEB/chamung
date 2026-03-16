import { IsEmail, IsString } from 'class-validator';

export class ChangeEmailRequestDto {
  @IsEmail()
  newEmail: string;
}

export class ChangeEmailConfirmDto {
  @IsString()
  token: string;
}
