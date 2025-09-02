import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, UseGuards, HttpCode } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { JwtGuard } from '../auth/guards/auth.guard';
import { CreateGoalDto } from './dto/create-goal.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../../generated/prisma';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @UseGuards(JwtGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creae goal by user' })
  @ApiResponse({ status: 200, description: 'Get Latest Movements by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async create(@Body() createGoalDto: CreateGoalDto, @GetUser() user: User) {
    const data = await this.goalsService.create(user.id, createGoalDto)

    return { data }
  }

  @UseGuards(JwtGuard)
  @Get()
  @ApiOperation({ summary: 'Get all goals by user' })
  @ApiResponse({ status: 200, description: 'Get Latest Movements by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async findAll(@GetUser() user: User) {
    const data = await this.goalsService.findAll(user.id)
    return { data }
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get all goals by user' })
  @ApiResponse({ status: 200, description: 'Get Latest Movements by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    const data = await this.goalsService.findOneById(id, user.id)
    return { data }
  }

  @UseGuards(JwtGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update goals by user' })
  @ApiResponse({ status: 200, description: 'Get Latest Movements by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async update(@Param('id') id: string, @Body() updateGoalDto: UpdateGoalDto, @GetUser() user: User) {
    const data = await this.goalsService.update(id, user.id, updateGoalDto)
    return { data }
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Remove goals by user' })
  @ApiResponse({ status: 200, description: 'Get Latest Movements by user successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found income' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async remove(@Param('id') id: string, @GetUser() user: User) {
    const data = await this.goalsService.remove(id, user.id)
    return { data }
  }


}
