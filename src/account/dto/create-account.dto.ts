import { IsDecimal, IsOptional, IsString } from "class-validator";

export class CreateAccountDto {

  @IsString()
  name: string

  @IsString()
  @IsOptional()
  type?: string

  @IsDecimal({ decimal_digits: '2' })
  balance: number

}
