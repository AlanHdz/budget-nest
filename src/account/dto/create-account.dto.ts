import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";
import { TypeAccount } from "../../../generated/prisma";

export class CreateAccountDto {

  @IsString()
  @IsNotEmpty()
  name: string

  @IsEnum(TypeAccount)
  type?: TypeAccount

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @IsPositive()
  balance: number

}
