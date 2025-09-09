import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { UserToken } from './interfaces/user-token.interface';

@Injectable()
export class AuthService {


  private readonly logger = new Logger('AuthService')


  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}


  async signUp(createUserDto: CreateUserDto) : Promise<UserToken> {

    try {
      
      const usernameExists = await this.userService.findByUsername(createUserDto.username)
      
      if (usernameExists) {
        throw new BadRequestException('Username already exists');
      }
      
      const emailExists = await this.userService.findByEmail(createUserDto.email);

      if (emailExists) {
        throw new BadRequestException('Email already exists');
      }

      const user = await this.userService.create(createUserDto);

      const { password: _, ...rest } = user

      const token = await this.getTokens(rest.id)

      return {
        ...rest,
        token
      }
      
    } catch (error) {
      this.handleErrors(error)
    }

  }

  async login(loginUserDto: LoginUserDto) : Promise<UserToken> {

    try {
      
      const { email, password } = loginUserDto

      const user = await this.userService.findByEmail(email)

      if (!user) {
        throw new NotFoundException(`No se encontro el usuario con el email ${email}`);
      }

      if (!bcrypt.compareSync(password, user.password)) {
        throw new BadRequestException('Las credenciales no son validas')
      }

      const token = await this.getTokens(user.id)

      const { password: _, ...rest } = user

      return {
        ...rest,
        token
      }

    } catch (error) {
      this.handleErrors(error)
    }

  }

   async getTokens(userId: string) {
    const token = await this.jwtService.signAsync({
      sub: userId
    })
    
    return token
  }

  private handleErrors(error: any) : never {

    this.logger.error(error);

    if (error instanceof HttpException) {
      throw error;
    }

    throw new InternalServerErrorException(error)

  }

}
