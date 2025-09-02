import { Body, Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { User } from '../../generated/prisma';
import { ExpensesByCategoryMonthDto } from './dto/expenses-by-category-month.dto';
import { IncomesByCategoryMonthDto } from './dto/incomes-by-category-month.dto';
import { LimitLatestMovementsDto } from './dto/limit-latest-movements.dto';
import { JwtGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/summary')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get summary incomes and expenses by the user' })
  @ApiResponse({ status: 200, description: 'Get summary incomes and expenses by the user successfully' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async getTotalBalance(@GetUser() user: User) {
    const data = await this.dashboardService.getTotalBalance(user)
    return { data }
  }

  @Get('/monthly-flow')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get monthly flow by the user' })
  @ApiResponse({ status: 200, description: 'Get monthly flow by the user successfully' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async getMonthlyFlow(@GetUser() user: User) {
    const data = await this.dashboardService.getMonthlyFlow(user);
    return { data }
  }

  @Get('/expenses-by-category')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get expenses by category belongs to user' })
  @ApiResponse({ status: 200, description: 'Get expenses by category belongs to user successfully' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async getExpensesByCategoryMonth(@Query() expensesByCategoryMonthDto: ExpensesByCategoryMonthDto, @GetUser() user: User) {
    const data = await this.dashboardService.getExpensesByCategoryMonthly(expensesByCategoryMonthDto, user)
    return { data }
  }

  @Get('/incomes-by-category')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get incomes by category belongs to user' })
  @ApiResponse({ status: 200, description: 'Get incomes by category belongs to user successfully' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async getIncomesByCategoryMonth(@Query() incomesByCategoryMonthDto: IncomesByCategoryMonthDto, @GetUser() user: User) {
    const data = await this.dashboardService.getIncomesByCategoryMonthly(incomesByCategoryMonthDto, user)
    return { data }
  }

  @Get('/latest-movements')
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Get 10 latest movements belongs to user' })
  @ApiResponse({ status: 200, description: 'Get 10 latest movements belongs to user successfully' })
  @ApiResponse({ status: 500, description: 'Error in the server' })
  async getLatetsMovements(
    @Query() limitLtaestMovementsDto: LimitLatestMovementsDto,
    @GetUser() user: User
  ) {
    const data = await this.dashboardService.getLatestMovements(limitLtaestMovementsDto, user)
    return { data }
  }

}
