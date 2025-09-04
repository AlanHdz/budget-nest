import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Frequency } from '../../generated/prisma';
import { addMonths, addWeeks, addYears } from 'date-fns';

@Injectable()
export class TasksService {

  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * This cron job runs every day at 1:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    name: 'recurringIncomes',
    timeZone: 'America/Mexico_City'
  })
  async handleRecurringIncomes() {
    this.logger.log('Running cron job: Checking for due recurring income')

    const now = new Date()

    const dueIncomes = await this.prisma.recurringIncome.findMany({
      where: {
        nextDate: {
          lte: now
        }
      }
    })

    if (dueIncomes.length === 0) {
      this.logger.log('No due recurring incomes found.')
      return
    }

    this.logger.log(`Found ${dueIncomes.length} due recurring incomes.`)

    for (const recurring of dueIncomes) {

      try {
        
        await this.prisma.$transaction(async (tx) => {

          await tx.income.create({
            data: {
              amount: recurring.amount,
              title: recurring.title,
              description: `Automaticamente generado por el ingreso recurrente: ${recurring.title}`,
              userId: recurring.userId,
              accountId: recurring.accountId,
              categoryId: recurring.categoryId,
              dateIncome: now,
              recurringIncomeId: recurring.id
            }
          })

          await tx.account.update({
            where: { id: recurring.accountId },
            data: {
              balance: {
                increment: recurring.amount
              }
            }
          })

          const newNextDate = this.calculateNextDate(recurring.nextDate, recurring.frequency);

          await tx.recurringIncome.update({
            where: { id: recurring.id },
            data: { nextDate: newNextDate }
          })
          this.logger.log(`Successfully processed recurring income: ${recurring.title} (ID: ${recurring.id})`);
        })
        
      } catch (error) {
        this.logger.error(`Failed to process recurring income ID: ${recurring.id}`, error.stack);
      }

    }

  }

  /**
   * This cron job runs every day at 1:05AM
   * It checks for any recurring expenses that are due.
   * 
   */
  @Cron('5 1 * * *', {
    name: 'recurringExpenses',
    timeZone: 'America/Mexico_City'
  })
  async handleRecurringExpenses() {
    this.logger.log('Running cron job: Checking for due recurring expenses...');

    const now = new Date();

    const dueExpenses = await this.prisma.recurringExpense.findMany({
      where: {
        nextDueDate: {
          lte: now
        }
      }
    })

    if (dueExpenses.length === 0) {
      this.logger.log('No due recurring expenses found.')
      return
    }

    this.logger.log(`Found ${dueExpenses.length} due recurring expenses.`)

    for (const recurring of dueExpenses) {

      try {
        
        await this.prisma.$transaction(async (tx) => {

          await tx.expense.create({
            data: {
              amount: recurring.amount,
              title: recurring.title,
              description: `Automaticamente generado por el ingreso recurrente: ${recurring.title}`,
              userId: recurring.userId,
              accountId: recurring.accountId,
              categoryId: recurring.categoryId,
              dateExpense: now,
              recurringExpenseId: recurring.id
            }
          })

          await tx.account.update({
            where: { id: recurring.accountId },
            data: {
              balance: {
                decrement: recurring.amount
              }
            }
          })

          const newNextDueDate = this.calculateNextDate(
            recurring.nextDueDate,
            recurring.frequency
          )

          await tx.recurringExpense.update({
            where: { id: recurring.id },
            data: { nextDueDate: newNextDueDate }
          })

          this.logger.log(`Successfully processed recurring expense: ${recurring.title} (ID: ${recurring.id})`);
        })

      } catch (error) {
        this.logger.log(`Successfully processed recurring expense: ${recurring.title} (ID: ${recurring.id})`);
      }

    }

  }

  private calculateNextDate(startDate: Date, frequency: Frequency) : Date {

    switch (frequency) {
        case Frequency.WEEKLY: return addWeeks(startDate, 1);
        case Frequency.BIWEEKLY: return addWeeks(startDate, 2);
        case Frequency.MONTHLY: return addMonths(startDate, 1);
        case Frequency.YEARLY: return addYears(startDate, 1);
        default: throw new Error('Invalid frequency');
    }

  }

}
