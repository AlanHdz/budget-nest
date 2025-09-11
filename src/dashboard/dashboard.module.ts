import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoalsModule } from '../goals/goals.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardIncomesService } from './incomes/dashboard-incomes.service';
import { DashboardExpensesService } from './expenses/dashboard-expenses.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardIncomesService, DashboardExpensesService],
  imports: [PrismaModule]
})
export class DashboardModule {}
