import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}


  @Get('/hola')
  async hola() {
    return await this.userService.findById("b216482d-2d58-4ce9-aa9f-0cc9aa9f70cc");
  }

}
