import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { User } from '../../generated/prisma';
import { JwtGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Expenses')
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiResponse({ status: 201, description: 'The expense has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async create(@Body() createExpenseDto: CreateExpenseDto, @GetUser() user: User) {
    const data = await this.expenseService.create(createExpenseDto, user);

    return { data }
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get all expenses by user' })
  @ApiResponse({ status: 200, description: 'Get all expenses by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async findAll(@GetUser() user) {
    const data = await this.expenseService.findAll(user);
    return { data }
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get an expense by user' })
  @ApiResponse({ status: 200, description: 'Get an expense by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found expense' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    const data = await this.expenseService.findOne(id, user);
    return { data }
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update an expense by user' })
  @ApiResponse({ status: 200, description: 'Update an expense by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found expense' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto, @GetUser() user: User) {
    const data = await this.expenseService.update(id, updateExpenseDto, user);
    return { data }
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete an expense by user' })
  @ApiResponse({ status: 200, description: 'Delete an expense by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found expense' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async remove(@Param('id') id: string, @GetUser() user: User) {
    const data = await this.expenseService.remove(id, user);
    return { data }
  }
}
