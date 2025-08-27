import { Module } from '@nestjs/common';
import { RecurringIncomeService } from './recurring-income.service';
import { RecurringIncomeController } from './recurring-income.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [RecurringIncomeController],
  providers: [RecurringIncomeService],
  imports: [PrismaModule]
})
export class RecurringIncomeModule {}
