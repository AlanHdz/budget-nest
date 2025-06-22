import { IsDecimal, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateExpenseDto {

  @IsDecimal({ decimal_digits: '2' })
  amount: number;

  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  description: string

  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

}
