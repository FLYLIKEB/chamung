import { ArrayMaxSize } from 'class-validator';
import { TeawareSelectionDto } from '../../teaware/dto/teaware.dto';
import {
  IsNumber,
  Min,
  Max,
  IsBoolean,
  ValidateNested,
  IsOptional,
  IsArray,
  IsString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

class AxisValueDto {
  @IsNumber()
  axisId: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  value: number;
}

export class PublishSessionToNoteDto {
  @IsNumber()
  schemaId: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating?: number | null;

  @IsOptional()
  @IsBoolean()
  isRatingIncluded?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AxisValueDto)
  axisValues: AxisValueDto[];

  @IsOptional()
  @Transform(({ value }) => value === null ? null : value)
  @IsString()
  memo?: string | null;

  @IsOptional()
  @IsArray({ message: 'tags must be an array' })
  @IsString({ each: true, message: 'each tag must be a string' })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => TeawareSelectionDto)
  teaware?: TeawareSelectionDto[];

  @IsBoolean()
  isPublic: boolean;
}
