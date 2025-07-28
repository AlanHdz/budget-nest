import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginUserDto {

  @ApiProperty({
    description: 'Email of the user',
    example: 'example@example.com'
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({
    description: 'Password of the user',
    example: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

}