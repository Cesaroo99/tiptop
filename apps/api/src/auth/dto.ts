import { IsBoolean, IsOptional, IsString, Length, Matches } from "class-validator";

export class RequestOtpDto {
  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;
}

export class VerifyOtpDto {
  @IsString()
  phone!: string;

  @IsString()
  @Matches(/^\d{4}$/)
  code!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;
}

export class ResendOtpDto {
  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;
}
