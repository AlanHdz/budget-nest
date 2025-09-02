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
    const data = await this.incomeService.create(createIncomeDto, user);
    return { data }
  }

  @Get('')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get Latest Movements by user' })
  @ApiResponse({ status: 200, description: 'Get Latest Movements by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async getPaginationIncomes(@GetUser() user: User, @Query() paginationDto: PaginationDto) {
    const data = await this.incomeService.getPaginatedIncomes(user, paginationDto);
    return { data }
  }

  @Get('/smart-summary')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get Smart Summary by user' })
  @ApiResponse({ status: 200, description: 'Get Latest Movements by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async getSmartSummary(@GetUser() user: User) {
    const data = await this.incomeService.getSmartSummary(user.id);
    return { data }
  }

  @Get('/monthly-goal')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get Monthly Goal by user' })
  @ApiResponse({ status: 200, description: 'Get Latest Movements by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async getMonthlyGoal(@GetUser() user: User) {
    const data = await this.incomeService.getMonthlyGoal(user.id);
    return { data }
  }

  @Get('/annual-projection')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get Annual Projection by user' })
  @ApiResponse({ status: 200, description: 'Get Latest Movements by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async getAnnualProjection(@GetUser() user:User) {
    const data = await this.incomeService.getAnnualProjection(user.id);
    return { data }
  }


  @Get(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get an income by user' })
  @ApiResponse({ status: 200, description: 'Get an income by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    const data = await this.incomeService.findOne(id, user);
    return { data}
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update an income by user' })
  @ApiResponse({ status: 200, description: 'Update an income by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async update(@Param('id') id: string, @Body() updateIncomeDto: UpdateIncomeDto, @GetUser() user: User) {
    const data = await this.incomeService.update(id, updateIncomeDto, user);
    return { data }
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Delete an income by user' })
  @ApiResponse({ status: 200, description: 'Delete an income by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async remove(@Param('id') id: string, @GetUser() user: User) {
    const data = await this.incomeService.remove(id, user);
    return { data }
  }
}
