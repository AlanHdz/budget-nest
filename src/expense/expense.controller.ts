import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { User } from '../../generated/prisma';
import { JwtGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body() createExpenseDto: CreateExpenseDto, @GetUser() user: User) {
    return this.expenseService.create(createExpenseDto, user);
  }

  @Get()
  @UseGuards(JwtGuard)
  findAll(@GetUser() user) {
    return this.expenseService.findAll(user);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.expenseService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto, @GetUser() user: User) {
    return this.expenseService.update(id, updateExpenseDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.expenseService.remove(id, user);
  }
}
