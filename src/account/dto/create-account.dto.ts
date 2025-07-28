import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";
import { TypeAccount } from "../../../generated/prisma";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAccountDto {

  @ApiProperty({
    description: 'The account name',
    example: 'New Account'
  })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({
    description: 'The type of the account',
    examples: ['DEBIT', 'CREDIT' ,'CASH', 'INVESTMENTS']
  })
  @IsEnum(TypeAccount)
  type?: TypeAccount

  @ApiProperty({
    description: 'Balance on the account',
    example: '1500.00'
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @IsPositive()
  balance: number

}
