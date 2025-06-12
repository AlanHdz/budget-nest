import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { Response } from 'express';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtGuard } from './guards/auth.guard';
import { GetUser } from './decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() createUserDto: CreateUserDto, @Res({ passthrough: true }) res: Response) {

    const user = await this.authService.signUp(createUserDto)

    const { token: _, ...rest } = user

    res.cookie('user_token', user.token, {
      expires: new Date(Date.now() + 86400000)
    })

    return { message: 'User created succesfully', user: rest }

  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto, @Res({ passthrough: true }) res: Response) {

    const user = await this.authService.login(loginUserDto)

    const { token: _, ...rest } = user

    res.cookie('user_token', user.token, {
      expires: new Date(Date.now() + 86400000)
    })

    return { message: 'User created succesfully', user: rest }

  }

  @UseGuards(JwtGuard)
  @Get('user')
  getUser(@GetUser() user) {
    return user;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res) {
    res.cookie('user_token', '', { expires: new Date(Date.now()) });
    return { message: 'User logout successfully' }
  }

}
