import { Module } from '@nestjs/common';
import { IncomeService } from './income.service';
import { IncomeController } from './income.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoalsModule } from '../goals/goals.module';

@Module({
  controllers: [IncomeController],
  providers: [IncomeService, PrismaService],
  imports: [GoalsModule]
})
export class IncomeModule {}
