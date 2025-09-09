import { Body, Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { User } from '../../generated/prisma';
import { ExpensesByCategoryMonthDto } from './dto/expenses-by-category-month.dto';
import { IncomesByCategoryMonthDto } from './dto/incomes-by-category-month.dto';
import { LimitLatestMovementsDto } from './dto/limit-latest-movements.dto';
import { JwtGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardIncomesService } from './incomes/dashboard-incomes.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly dashboardIncomesService: DashboardIncomesService
  ) {}

  @Get('/incomes')
  @UseGuards(JwtGuard)
  async getDashboardIncomes(@GetUser() user: User) {
    return await this.dashboardIncomesService.getIncomesDashboard(user.id)
  }

  @Get('/incomes/latest-movements')
  @UseGuards(JwtGuard)
  async getPaginatedIncomes(@GetUser() user: User, @Query() paginationDto: PaginationDto) {
    return await this.dashboardIncomesService.getPaginatedIncomes(user, paginationDto)
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
    return await this.dashboardService.getLatestMovements(limitLtaestMovementsDto, user)
  }

}
