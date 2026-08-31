import { IsOptional, IsString, Length, Matches } from "class-validator";

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @Length(1, 40)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 30)
  @Matches(/^[a-zA-Z0-9._]+$/)
  username?: string;

  @IsOptional()
  @IsString()
  @Length(0, 80)
  profession?: string;

  @IsOptional()
  @IsString()
  @Length(2, 5)
  locale?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(light|dark)$/)
  theme?: string;

  @IsOptional()
  @IsString()
  @Length(0, 80)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(0, 80)
  zone?: string;
}
