import { ApiProperty } from "@nestjs/swagger";
import { IsAlphanumeric, IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";


export class CreateUserDto
{
    @ApiProperty({
        description: 'The name of the user'
    })
    @IsString({ message: 'El nombre debe ser una cadena de texto.' })
    @IsNotEmpty({ message: 'La contraseña no puede estar vacia.' })
    name: string;

    @ApiProperty({
        description: 'The username of the user',
    })
    @IsAlphanumeric(undefined, { message: 'El nombre de usuario solo puede contener caracteres alfanumericos.' })
    @IsNotEmpty({ message: 'La contraseña no puede estar vacia.' })
    username: string;

    @ApiProperty({
        description: 'The email of the user',
        example: 'example@example.com'
    })
    @IsEmail()
    @IsString({ message: 'El email debe ser una cadena de texto.' })
    @IsNotEmpty({ message: 'La contraseña no puede estar vacia.' })
    email: string;

    @ApiProperty({
        description: 'The password of the user',
    })
    @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
    @IsStrongPassword({}, { message: 'La contraseña no es segura.'})
    @IsNotEmpty({ message: 'La contraseña no puede estar vacia.' })
    password: string

}