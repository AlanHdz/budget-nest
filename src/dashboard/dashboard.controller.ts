import { Body, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { User } from '../../generated/prisma';
import { ExpensesByCategoryMonthDto } from './dto/expenses-by-category-month.dto';
import { IncomesByCategoryMonthDto } from './dto/incomes-by-category-month.dto';
import { LimitLatestMovementsDto } from './dto/limit-latest-movements.dto';
import { JwtGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/summary')
  @UseGuards(JwtGuard)
  async getTotalBalance(@GetUser() user: User) {
    return await this.dashboardService.getTotalBalance(user)
  }

  @Get('/monthly-flow')
  @UseGuards(JwtGuard)
  async getMonthlyFlow(@GetUser() user: User) {
    return await this.dashboardService.getMonthlyFlow(user);
  }

  @Get('/expenses-by-category')
  @UseGuards(JwtGuard)
  async getExpensesByCategoryMonth(@Query() expensesByCategoryMonthDto: ExpensesByCategoryMonthDto, @GetUser() user: User) {
    return await this.dashboardService.getExpensesByCategoryMonthly(expensesByCategoryMonthDto, user)
  }

  @Get('/incomes-by-category')
  @UseGuards(JwtGuard)
  async getIncomesByCategoryMonth(@Query() incomesByCategoryMonthDto: IncomesByCategoryMonthDto, @GetUser() user: User) {
    return await this.dashboardService.getIncomesByCategoryMonthly(incomesByCategoryMonthDto, user)
  }

  @Get('/latest-movements')
  @UseGuards(JwtGuard)
  async getLatetsMovements(
    @Query() limitLtaestMovementsDto: LimitLatestMovementsDto,
    @GetUser() user: User
  ) {
    return await this.dashboardService.getLatestMovements(limitLtaestMovementsDto, user)
  }

}
