import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [BudgetService],
  controllers: [BudgetController],
  imports: [PrismaModule]
})
export class BudgetModule {}
