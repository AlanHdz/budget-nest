import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Type } from "../../../generated/prisma";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCategoryDto {

  @ApiProperty({
    description: 'The category name',
    example: 'New Category'
  })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({
    description: 'The type of the category',
    example: ['INCOME', 'EXPENSE']
  })
  @IsEnum(Type)
  @IsNotEmpty()
  type: Type

  @ApiProperty({
    description: 'Emoji of the category',
    example: '😊'
  })
  @IsNotEmpty()
  @IsString()
  emoji: string;

  @ApiProperty({
    description: 'Color of the category',
  })
  @IsNotEmpty()
  @IsString()
  color: string;
}
