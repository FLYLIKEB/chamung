import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUrl, MaxLength, Min, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { TEAWARE_KINDS, TeawareKind } from '../teaware.types';

export class TeawareSelectionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @IsIn(TEAWARE_KINDS)
  kind: TeawareKind;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsUrl({ protocols: ['https', 'http'], require_protocol: true, require_tld: false })
  @MaxLength(2048)
  imageUrl?: string;
}

export class CreateTeawareDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @IsIn(TEAWARE_KINDS)
  kind: TeawareKind;

  @IsUrl({ protocols: ['https', 'http'], require_protocol: true, require_tld: false })
  @MaxLength(2048)
  imageUrl: string;
}

export class UpdateTeawareDto extends PartialType(CreateTeawareDto, { skipNullProperties: false }) {}
