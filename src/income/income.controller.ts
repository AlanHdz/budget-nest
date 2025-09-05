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
  @ApiOperation({ summary: 'Cretes new user\'s income' })
  @ApiResponse({ status: 201, description: 'The income has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async create(@Body() createIncomeDto: CreateIncomeDto, @GetUser() user: User) {
    return await this.incomeService.create(createIncomeDto, user);
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get all user\'s incomes' })
  @ApiResponse({ status: 200, description: 'Get all user\'s incomes successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async findAll(@GetUser() user: User) {
    return await this.incomeService.findAll(user.id)
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get a user\'s income' })
  @ApiResponse({ status: 200, description: 'Get a user\'s income successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    return await this.incomeService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update a user\'s income' })
  @ApiResponse({ status: 200, description: 'Update a user\'s income successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async update(@Param('id') id: string, @Body() updateIncomeDto: UpdateIncomeDto, @GetUser() user: User) {
    return await this.incomeService.update(id, updateIncomeDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete a user\'s income' })
  @ApiResponse({ status: 204, description: 'Delete a user\'s income successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  @HttpCode(204)
  async remove(@Param('id') id: string, @GetUser() user: User) {
    return await this.incomeService.remove(id, user);
  }
}
