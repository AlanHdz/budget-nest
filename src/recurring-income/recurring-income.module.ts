import { Module } from '@nestjs/common';
import { RecurringIncomeService } from './recurring-income.service';
import { RecurringIncomeController } from './recurring-income.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RecurringIncomeController],
  providers: [RecurringIncomeService, PrismaService],
})
export class RecurringIncomeModule {}
