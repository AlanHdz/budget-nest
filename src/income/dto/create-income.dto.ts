import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsDecimal, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";
import { Frequency } from "../../../generated/prisma";

export class CreateIncomeDto {

  @ApiProperty({
    description: 'The amount of the income',
    example: '1500.00'
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'The title of the income',
    example: 'New income'
  })
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiProperty({
    description: 'The description of the income',
    example: 'deposit to debit account'
  })
  @IsString()
  @IsOptional()
  description: string

  @ApiProperty({
    description: 'The account id of the income',
    example: 'Account UUID'
  })
  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({
    description: 'The category id of the income',
    example: 'Category UUID'
  })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsDateString()
  dateIncome: string

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsEnum(Frequency)
  @IsOptional()
  frequency?: Frequency;

}
