import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { Response } from 'express';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtGuard } from './guards/auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create a new user and return jwt token' })
  @ApiResponse({ status: 400, description: 'Username or email already exists' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async signUp(@Body() createUserDto: CreateUserDto, @Res({ passthrough: true }) res: Response) {

    const user = await this.authService.signUp(createUserDto)

    const { token: _, ...rest } = user

    res.cookie('user_token', user.token, {
      expires: new Date(Date.now() + 86400000)
    })

    return { message: 'User created succesfully', user: rest }

  }

  @Post('login')
  @ApiOperation({ summary: 'Login user and create jwt token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Credentials are not valid' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async login(@Body() loginUserDto: LoginUserDto, @Res({ passthrough: true }) res: Response) {

    const user = await this.authService.login(loginUserDto)

    const { token: _, ...rest } = user

    res.cookie('user_token', user.token, {
      expires: new Date(Date.now() + 86400000)
    })

    return { message: 'User login succesfully', user: rest }

  }

  @UseGuards(JwtGuard)
  @Get('user')
  @ApiOperation({ summary: 'Login user and create jwt token' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUser(@GetUser() user) {
    return user;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Remove user token' })
  async logout(@Res({ passthrough: true }) res) {
    res.cookie('user_token', '', { expires: new Date(Date.now()) });
    return { message: 'User logout successfully' }
  }

}
