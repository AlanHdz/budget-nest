import { Body, Controller, Post, UseGuards, Get, HttpStatus } from '@nestjs/common';
import { RecurringIncomeService } from './recurring-income.service';
import { JwtGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../../generated/prisma';
import { CreateRecurringIncomeDto } from './dto/create-recurring-income.dto';

@Controller('recurring-income')
export class RecurringIncomeController {
  constructor(private readonly recurringIncomeService: RecurringIncomeService) {}

  @Post('/')
  @UseGuards(JwtGuard)
  async create(@GetUser() user: User, @Body() createRecurringIncomeDto: CreateRecurringIncomeDto) {
    const data = await this.recurringIncomeService.create(user.id, createRecurringIncomeDto);
    return { data, status: HttpStatus.CREATED }
  }

  @Get('/')
  @UseGuards(JwtGuard)
  async findAll(@GetUser() user: User) {
    const data = await this.recurringIncomeService.findAll(user.id);
    return { data, status: HttpStatus.OK }
  }

}
