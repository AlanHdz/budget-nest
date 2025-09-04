import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { User } from '../../generated/prisma';
import { JwtGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaginationDto } from '../common/dto/pagination.dto';

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
    return await this.expenseService.create(createExpenseDto, user);
  }

  @Get('/dashboard')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: "Get dashboard for expenses" })
  @ApiResponse({ status: 200, description: 'Get dashboard for expenses successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async getDashboard(@GetUser() user: User) {
    return await this.expenseService.getDashboardExpenses(user.id)
  }

  @Get('/latest-movements')
  @ApiOperation({ summary: "Get last 5 user's expenses" })
  @ApiResponse({ status: 200, description: 'Get last 5 user\'s expenses successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  @UseGuards(JwtGuard)
  async getPaginationExpenses(@GetUser() user: User, @Query() paginationDto: PaginationDto) {
    return await this.expenseService.getPaginatedExpenses(user.id, paginationDto)
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get an expense by user' })
  @ApiResponse({ status: 200, description: 'Get an expense by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found expense' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    return await this.expenseService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update an expense by user' })
  @ApiResponse({ status: 200, description: 'Update an expense by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found expense' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto, @GetUser() user: User) {
    return await this.expenseService.update(id, updateExpenseDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete an expense by user' })
  @ApiResponse({ status: 204, description: 'Delete an expense by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found expense' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  @HttpCode(204)
  async remove(@Param('id') id: string, @GetUser() user: User) {
    return await this.expenseService.remove(id, user);
  }
}
