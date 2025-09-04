import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, Query, HttpCode } from '@nestjs/common';
import { IncomeService } from './income.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { JwtGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from '../../generated/prisma';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Incomes')
@Controller('incomes')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new income' })
  @ApiResponse({ status: 201, description: 'The income has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async create(@Body() createIncomeDto: CreateIncomeDto, @GetUser() user: User) {
    return await this.incomeService.create(createIncomeDto, user);
  }

  @Get('/dashboard')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: "Get dashboard for incomes" })
  @ApiResponse({ status: 200, description: 'Get dashboard for incomes successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async dashboard(@GetUser() user: User) {
    return await this.incomeService.getIncomesDashboard(user.id);
  }

  @Get('/latest-movements')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get Latest user\'s incomes paginated' })
  @ApiResponse({ status: 200, description: 'Get Latest 5 user\'s incomes paginated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async getPaginationIncomes(@GetUser() user: User, @Query() paginationDto: PaginationDto) {
    return await this.incomeService.getPaginatedIncomes(user, paginationDto);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get an income by user' })
  @ApiResponse({ status: 200, description: 'Get an income by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    return await this.incomeService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update an income by user' })
  @ApiResponse({ status: 200, description: 'Update an income by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async update(@Param('id') id: string, @Body() updateIncomeDto: UpdateIncomeDto, @GetUser() user: User) {
    return await this.incomeService.update(id, updateIncomeDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete an income by user' })
  @ApiResponse({ status: 204, description: 'Delete an income by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  @HttpCode(204)
  async remove(@Param('id') id: string, @GetUser() user: User) {
    return await this.incomeService.remove(id, user);
  }
}
