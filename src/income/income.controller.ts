import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { IncomeService } from './income.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { JwtGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('incomes')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() createIncomeDto: CreateIncomeDto, @GetUser() user) {
    return this.incomeService.create(createIncomeDto, user);
  }

  @Get()
  @UseGuards(JwtGuard)
  findAll(@GetUser() user) {
    return this.incomeService.findAll(user);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string, @GetUser() user) {
    return this.incomeService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  update(@Param('id') id: string, @Body() updateIncomeDto: UpdateIncomeDto, @GetUser() user) {
    return this.incomeService.update(id, updateIncomeDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@Param('id') id: string, @GetUser() user) {
    return this.incomeService.remove(id, user);
  }
}
