import { IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";
import { Frequency } from "../../../generated/prisma";


export class CreateRecurringIncomeDto {

  @IsString()
  title: string

  @IsString()
  @IsOptional()
  description: string

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(Frequency)
  frequency: Frequency

  @IsDateString()
  firstPaymentDate: string;

  @IsUUID()
  accountId: string;

  @IsUUID()
  categoryId: string
}