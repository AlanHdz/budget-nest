import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus } from '@nestjs/common';
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
  @ApiResponse({ status: 500, description: 'Error in the server' })
  create(@Body() createAccountDto: CreateAccountDto, @GetUser() user) {
    return this.accountService.create(createAccountDto, user);
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get all accounts by user' })
  @ApiResponse({ status: 200, description: 'Get all accounts by user succesfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async findAll(@GetUser() user) {
    const data = await this.accountService.findAll(user);

    return { data, status: HttpStatus.OK }
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get an account by user' })
  @ApiResponse({ status: 200, description: 'Get one account by user succesfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found account' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  findOne(@Param('id') id: string, @GetUser() user) {
    return this.accountService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update an account by user' })
  @ApiResponse({ status: 200, description: 'Update an account by user succesfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  @ApiResponse({ status: 404, description: 'Not found account' })
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto, @GetUser() user) {
    return this.accountService.update(id, updateAccountDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete an account by user' })
  @ApiResponse({ status: 200, description: 'Delete an account by user succesfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  @ApiResponse({ status: 404, description: 'Not found account' })
  remove(@Param('id') id: string, @GetUser() user) {
    return this.accountService.remove(id, user);
  }
}
