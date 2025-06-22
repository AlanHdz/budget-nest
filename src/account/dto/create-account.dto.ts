import { IsDecimal, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { TypeAccount } from "generated/prisma";

export class CreateAccountDto {

  @IsString()
  @IsNotEmpty()
  name: string

  @IsEnum(TypeAccount)
  type?: TypeAccount

  @IsDecimal({ decimal_digits: '2' })
  @IsNotEmpty()
  balance: number

}
