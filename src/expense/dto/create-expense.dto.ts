import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsDecimal, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";
import { Frequency } from "../../../generated/prisma";

export class CreateExpenseDto {

  @ApiProperty({
    description: 'The amount of the expense',
    example: '1500.00'
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'The title of the expense',
    example: 'New expense'
  })
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiProperty({
    description: 'The description of the expense',
    example: 'Buy a Cheese Burger'
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
  dateExpense: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean

  @IsEnum(Frequency)
  @IsOptional()
  frequency?: Frequency

}
