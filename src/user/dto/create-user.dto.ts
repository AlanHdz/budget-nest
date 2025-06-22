import { IsAlphanumeric, IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";


export class CreateUserDto
{
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsAlphanumeric()
    @IsNotEmpty()
    username: string;

    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsStrongPassword()
    @IsNotEmpty()
    password: string

}