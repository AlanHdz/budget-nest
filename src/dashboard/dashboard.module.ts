import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoalsModule } from '../goals/goals.module';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService],
  imports: [GoalsModule]
})
export class DashboardModule {}
