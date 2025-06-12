import { IsAlphanumeric, IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";


export class CreateUserDto
{
    @IsString()
    name: string;

    @IsString()
    lastName: string;

    @IsAlphanumeric()
    username: string;

    @IsEmail()
    @IsString()
    email: string;

    @IsString()
    @IsStrongPassword()
    password: string

}