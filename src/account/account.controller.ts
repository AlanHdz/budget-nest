import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

import { JwtGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'The account has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async create(@Body() createAccountDto: CreateAccountDto, @GetUser() user) {
    return await this.accountService.create(createAccountDto, user);
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get all accounts by user' })
  @ApiResponse({ status: 200, description: 'Get all accounts by user succesfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async findAll(@GetUser() user) {
    return await this.accountService.findAll(user);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get an account by user' })
  @ApiResponse({ status: 200, description: 'Get one account by user succesfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found account' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async findOne(@Param('id') id: string, @GetUser() user) {
    return await this.accountService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update an account by user' })
  @ApiResponse({ status: 200, description: 'Update an account by user succesfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  @ApiResponse({ status: 404, description: 'Not found account' })
  async update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto, @GetUser() user) {
    return await this.accountService.update(id, updateAccountDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete an account by user' })
  @ApiResponse({ status: 204, description: 'Delete an account by user succesfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  @ApiResponse({ status: 404, description: 'Not found account' })
  @HttpCode(204)
  async remove(@Param('id') id: string, @GetUser() user) {
    return await this.accountService.remove(id, user);
  }
}
