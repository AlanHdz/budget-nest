import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { IncomeService } from './income.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { JwtGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Incomes')
@Controller('incomes')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Create a new income' })
  @ApiResponse({ status: 201, description: 'The income has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  create(@Body() createIncomeDto: CreateIncomeDto, @GetUser() user) {
    return this.incomeService.create(createIncomeDto, user);
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get all incomes by user' })
  @ApiResponse({ status: 200, description: 'Get all incomes by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  findAll(@GetUser() user) {
    return this.incomeService.findAll(user);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get an income by user' })
  @ApiResponse({ status: 200, description: 'Get an income by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  findOne(@Param('id') id: string, @GetUser() user) {
    return this.incomeService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update an income by user' })
  @ApiResponse({ status: 200, description: 'Update an income by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  update(@Param('id') id: string, @Body() updateIncomeDto: UpdateIncomeDto, @GetUser() user) {
    return this.incomeService.update(id, updateIncomeDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete an income by user' })
  @ApiResponse({ status: 200, description: 'Delete an income by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  remove(@Param('id') id: string, @GetUser() user) {
    return this.incomeService.remove(id, user);
  }
}
