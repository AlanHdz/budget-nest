import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';
import { Frequency, Goal, GoalType, Income, Prisma, RecurringIncome, User } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { addMonths, addWeeks, addYears, endOfMonth, getMonth, getYear, startOfMonth, subMonths, subWeeks, subYears } from 'date-fns';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AnnualProjection, IncomesDashboard, MonthlyGoal, SmartSummary } from './interfaces/income-dashboard.interface';

@Injectable()
export class IncomeService {

  private readonly logger = new Logger('IncomeService')

  constructor(
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Creates a user's income
   * @param createIncomeDto
   * @param user 
   * @returns {Promise<Income>}
   */
  async create(createIncomeDto: CreateIncomeDto, user: User): Promise<{ data: Income }> {

    try {

      const { isRecurring, frequency, ...incomeData } = createIncomeDto

      const { accountId, amount } = incomeData;

      const account = await this.prisma.account.findFirst({
        where: { id: accountId, userId: user.id }
      })

      if (!account) {
        throw new NotFoundException(`La cuenta con ID ${accountId} no fue encontrada`)
      }

      if (isRecurring && !frequency) {
        throw new BadRequestException(':a frecuencia es requerida para los ingresos recurrentes.');
      }


      const newIncome = await this.prisma.$transaction(async (prismaTx) => {

        await prismaTx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: amount
            }
          }
        })

        let createdIncome: Income;

        if (isRecurring) {
          const startDate = incomeData.dateIncome ? new Date(incomeData.dateIncome) : new Date()
          const nextDate = this.calculateNextDate(startDate, frequency)

          const recurringIncome = await prismaTx.recurringIncome.create({
            data: {
              title: incomeData.title,
              amount: incomeData.amount,
              frequency: frequency ?? Frequency.MONTHLY,
              startDate,
              nextDate,
              userId: user.id,
              accountId: incomeData.accountId,
              categoryId: incomeData.categoryId
            }
          })

          createdIncome = await prismaTx.income.create({
            data: {
              ...incomeData,
              userId: user.id,
              dateIncome: startDate,
              recurringIncomeId: recurringIncome.id
            }
          })

        } else {
          createdIncome = await prismaTx.income.create({
            data: {
              ...incomeData,
              userId: user.id
            }
          })
        }

        return newIncome

      })

      return { data: newIncome }

    } catch (error) {

      this.handleErrors(error)
    }

  }

  /**
   * Get a specific user's income
   * @param id 
   * @param user 
   * @returns {Promise<Income>}
   */
  async findOne(id: string, user: User): Promise<{ data: Income }> {

    try {

      const income = await this.prisma.income.findUnique({
        where: { userId: user.id, id: id },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      if (!income) {
        throw new NotFoundException('Income not found')
      }

      return { data: income };

    } catch (error) {
      this.handleErrors(error)
    }


  }

  /**
   * Updates a specific user's income
   * @param id 
   * @param updateIncomeDto 
   * @param user 
   * @returns {Promise<Income>}
   */
  async update(id: string, updateIncomeDto: UpdateIncomeDto, user: User): Promise<{ data: Income }> {

    try {

      const { isRecurring, frequency, ...incomeData } = updateIncomeDto;

      const { accountId, amount } = incomeData;

      const account = await this.prisma.account.findFirst({
        where: { id: accountId, userId: user.id }
      })

      if (!account) {
        throw new NotFoundException(`La cuenta con ID ${accountId} no fue encontrada.`)
      }

      const incomeOriginal = await this.prisma.income.findFirst({
        where: { id: id, userId: user.id }
      })

      if (!incomeOriginal) {
        throw new NotFoundException(`El ingreso con ID ${incomeOriginal} no fue encontrado.`)
      }

      const isBecomingRecurring = isRecurring === true && !incomeOriginal.recurringIncomeId;

      if (isBecomingRecurring && !frequency) {
        throw new BadRequestException('La frecuencia is requerida para hacer un ingreso recurrente.')
      }

      const finalUpdatedIncome = await this.prisma.$transaction(async (prismaTx) => {

        await prismaTx.account.update({
          where: { id: incomeOriginal.accountId },
          data: { balance: { decrement: incomeOriginal.amount } }
        })

        const newAmount = incomeData.amount ?? incomeOriginal.amount
        const newAccountId = incomeData.accountId ?? incomeOriginal.accountId

        await prismaTx.account.update({
          where: { id: newAccountId },
          data: { balance: { increment: newAmount } }
        })

        const dataForUpdate: any = { ...incomeData }

        if (isRecurring === true && !incomeOriginal.recurringIncomeId) {

          const startDate = incomeOriginal.dateIncome;
          const nextDate = this.calculateNextDate(startDate, frequency)

          const newRecurringIncome = await prismaTx.recurringIncome.create({
            data: {
              title: incomeData.title || incomeOriginal.title,
              amount: newAmount,
              frequency: frequency || Frequency.MONTHLY,
              startDate,
              nextDate,
              userId: user.id,
              accountId: newAccountId,
              categoryId: incomeData.categoryId || incomeOriginal.categoryId
            }
          })

          dataForUpdate.recurringIncomeId = newRecurringIncome.id
        } else if (isRecurring === false && incomeOriginal.recurringIncomeId) {

          await prismaTx.recurringIncome.delete({
            where: { id: incomeOriginal.recurringIncomeId }
          })

          dataForUpdate.recurringIncomeId = null;
        }

        const finalUpdatedIncome = await prismaTx.income.update({
          where: { id: id },
          data: dataForUpdate
        })

        return finalUpdatedIncome;
      })

      return { data: finalUpdatedIncome }

    } catch (error) {
      this.handleErrors(error)
    }

  }

  /**
   * Removes a specific user's income
   * @param id 
   * @param user 
   * @returns {Promise<Object>}
   */
  async remove(id: string, user: User): Promise<void> {

    const incomeOriginal = await this.prisma.income.findFirst({
      where: { id: id, userId: user.id }
    })

    if (!incomeOriginal) {
      throw new NotFoundException('Income not found')
    }

    this.prisma.$transaction(async (prismaTX) => {


      await prismaTX.account.update({
        where: {
          id: incomeOriginal.accountId,
        },
        data: {
          balance: {
            decrement: incomeOriginal.amount
          }
        }
      })

      await prismaTX.income.delete({
        where: {
          id: id
        }
      })

    })

  }

  /**
   * Get last 5 user's incomes
   * @param user 
   * @param paginationDto
   * @returns { data: { incomes: Income[], total: number } }
   */
  async getPaginatedIncomes(user: User, paginationDto: PaginationDto): Promise<{ data: { incomes: Income[], total: number } }> {

    try {

      const { page = 1, limit = 5, search } = paginationDto

      const skip = (page - 1) * limit

      const whereCondition: Prisma.IncomeWhereInput = {
        userId: user.id
      }

      if (search) {
        whereCondition.title = {
          contains: search,
          mode: 'insensitive',
        };
      }

      const [incomes, total] = await Promise.all([
        this.prisma.income.findMany({
          where: whereCondition,
          include: {
            category: {
              select: {
                id: true,
                name: true,
                color: true,
                emoji: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: limit,
          skip: skip
        }),
        this.prisma.income.count({
          where: whereCondition,
        }),
      ])

      return { data: { incomes, total: total } };

    } catch (error) {
      this.handleErrors(error)
    }

  }

  /**
   * Get all resources for incomes dashboard
   * @param userId 
   * @returns { data: IncomesDashboard }
   */
  async getIncomesDashboard(userId: string) : Promise<{ data: IncomesDashboard  }> {

    try {

      const today = new Date()
      const dateRanges = {
        currentMonthStart: startOfMonth(today),
        currentMonthEnd: endOfMonth(today),
        previousMonthStart: startOfMonth(subMonths(today, 1)),
        sixMonthsAgo: subMonths(today, 6),
      };

      const [
        currentMonthTotalResult,
        previousMonthTotalResult,
        totalLast6MonthsResult,
        largestIncomeThisMonth,
        allRecurringIncomes,
        monthlyGoal
      ] = await Promise.all([
        this.prisma.income.aggregate({
          where: {
            userId,
            createdAt: {
              gte: dateRanges.currentMonthStart,
              lte: dateRanges.currentMonthEnd
            }
          },
          _sum: { amount: true }
        }),
        this.prisma.income.aggregate({
          where: {
            userId,
            createdAt:
              { gte: dateRanges.previousMonthStart, lte: endOfMonth(dateRanges.previousMonthStart) }
          },
          _sum: { amount: true }
        }),
        this.prisma.income.aggregate({
          where: {
            userId,
            createdAt: { gte: dateRanges.sixMonthsAgo }
          },
          _sum: { amount: true }
        }),
        this.prisma.income.findFirst({
          where: {
            userId,
            createdAt: { gte: dateRanges.currentMonthStart, lte: dateRanges.currentMonthEnd }
          },
          orderBy: { amount: 'desc' }
        }),
        this.prisma.recurringIncome.findMany({
          where: { userId },
          orderBy: { nextDate: 'asc' }
        }),
        this.prisma.goal.findUnique({
          where: {
            userId_type_month_year: { userId, type: GoalType.INCOME, month: getMonth(today) + 1, year: getYear(today) }
          }
        }),
      ])

      const currentMonthTotal = currentMonthTotalResult._sum.amount?.toNumber() || 0;
      const previousMonthTotal = previousMonthTotalResult._sum.amount?.toNumber() || 0;

      const smartSummary = await this._processSmartSummary(currentMonthTotal, previousMonthTotal, totalLast6MonthsResult._sum.amount?.toNumber() || 0, largestIncomeThisMonth, allRecurringIncomes);
      const monthlyGoalSummary = await this._processMonthlyGoal(monthlyGoal, currentMonthTotal);
      const annualProjection = await this._processAnnualProjection(allRecurringIncomes);

      return {
        data: {
          smartSummary,
          monthlyGoal: monthlyGoalSummary,
          annualProjection,
        },
      };

    } catch (error) {
      this.handleErrors(error)
    }
  }

  /**
   * Processes the data for the Smart Summary component.
   * @returns {SmartSummary}
   */
  private async _processSmartSummary(currentMonthTotal: number, previousMonthTotal: number, totalLast6Months: number, largestIncome: Income | null, recurringIncomes: RecurringIncome[]): Promise<SmartSummary> {

    try {

      let trend = 0;
      if (previousMonthTotal > 0) {
        trend = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
      } else if (currentMonthTotal > 0) {
        trend = 100;
      }

      const averageMonthlyIncome = totalLast6Months / 6;
      const nextExpectedIncome = recurringIncomes.find(ri => ri.nextDate >= new Date)

      return {
        averageMonthlyIncome: parseFloat(averageMonthlyIncome.toFixed(2)),
        largestSource: {
          name: largestIncome?.title || 'N/A',
          amount: largestIncome?.amount?.toNumber() || 0,
        },
        nextExpectedIncome: {
          name: nextExpectedIncome?.title || 'N/A',
          amount: nextExpectedIncome?.amount?.toNumber() || 0,
        },
        trend: {
          percentage: parseFloat(trend.toFixed(1)),
          vs: 'previous month',
        },
      }

    } catch (error) {
      this.handleErrors(error)
    }

  }

  /**
   * Processes the data for the Monthly Goal
   * @param monthlyGoal 
   * @param currentMonthTotal 
   * @returns {MonthlyGoal | null}
   */
  private async _processMonthlyGoal(monthlyGoal: Goal | null, currentMonthTotal: number): Promise<MonthlyGoal | null> {

    if (!monthlyGoal) {
      return null
    }

    const goalAmount = monthlyGoal.amount.toNumber();
    const goalPercentage = goalAmount > 0 ? (currentMonthTotal / goalAmount) * 100 : 0;

    return {
      progress: currentMonthTotal,
      goal: goalAmount,
      percentageCompleted: parseFloat(goalPercentage.toFixed(1)),
      remaining: Math.max(0, goalAmount - currentMonthTotal),
    };

  }

  /**
   * Processes the data for Annual Projection
   * @param recurringIncomes 
   * @returns { AnnualProjection }
   */
  private async _processAnnualProjection(recurringIncomes: RecurringIncome[]): Promise<AnnualProjection> {
    try {
      
      let projectedAnnualFromRecurring = 0;
      const multiplier = { 
        [Frequency.WEEKLY]: 52, 
        [Frequency.BIWEEKLY]: 26, 
        [Frequency.MONTHLY]: 12, 
        [Frequency.YEARLY]: 1 
      };

      recurringIncomes.forEach(ri => {
        projectedAnnualFromRecurring += ri.amount.toNumber() * (multiplier[ri.frequency] || 0);
      });

      return {
      recurringMonthlyIncome: parseFloat((projectedAnnualFromRecurring / 12).toFixed(2)),
      projectedAnnualIncome: parseFloat(projectedAnnualFromRecurring.toFixed(2)),
      upcomingRecurringIncomes: recurringIncomes.slice(0, 3).map(ri => ({
        id: ri.id,
        title: ri.title,
        amount: ri.amount.toNumber(),
      })),
    };

    } catch (error) {
      this.handleErrors(error)
    }
  }

  /**
   * Calculate the next date for income
   * @param startDate 
   * @param frequency 
   * @returns { Date }
   */
  private calculateNextDate(currentNexDate: Date, frequency: Frequency | undefined): Date {

    switch (frequency) {

      case 'MONTHLY':
        return addMonths(currentNexDate, 1);
      case 'WEEKLY':
        return addWeeks(currentNexDate, 1);
      case 'BIWEEKLY': //Quincenal
        return addWeeks(currentNexDate, 2);
      case 'YEARLY':
        return addYears(currentNexDate, 1)
      default:
        return currentNexDate
    }

  }

  private handleErrors(error: any): never {

    if (error.response) {
      throw error
    }

    this.logger.error(error);

    if (error instanceof BadRequestException) {
      throw error;
    }

    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('The account does not exist or does not belong to you');
    }

    throw new InternalServerErrorException(error)
  }
}
