import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtGuard } from 'src/auth/guards/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() createAccountDto: CreateAccountDto, @GetUser() user) {
    return this.accountService.create(createAccountDto, user);
  }

  @Get()
  @UseGuards(JwtGuard)
  async findAll(@GetUser() user) {
    return await this.accountService.findAll(user);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string, @GetUser() user) {
    return this.accountService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto, @GetUser() user) {
    return this.accountService.update(id, updateAccountDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@Param('id') id: string, @GetUser() user) {
    return this.accountService.remove(id, user);
  }
}
