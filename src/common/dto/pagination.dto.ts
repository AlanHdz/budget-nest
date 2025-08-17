import { Type } from "class-transformer";
import { IsOptional, IsPositive, IsString, Min } from "class-validator";

export class PaginationDto {

  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit: number;

  @IsOptional()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  page: number;

  @IsOptional()
  @IsString()
  search?: string
}