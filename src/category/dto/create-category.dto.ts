import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Type } from "generated/prisma";

export class CreateCategoryDto {

  @IsString()
  @IsNotEmpty()
  name: string

  @IsEnum(Type)
  @IsNotEmpty()
  type: Type

  @IsNotEmpty()
  @IsString()
  emoji: string;
}
