import { ApiProperty } from "@nestjs/swagger";
import { IsAlphanumeric, IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";


export class CreateUserDto
{
    @ApiProperty({
        description: 'The name of the user'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'The last name of the user',
    })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({
        description: 'The username of the user',
    })
    @IsAlphanumeric()
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        description: 'The email of the user',
        example: 'example@example.com'
    })
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'The password of the user',
    })
    @IsString()
    @IsStrongPassword()
    @IsNotEmpty()
    password: string

}