import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Frequency, Goal, GoalType, Income, Prisma, RecurringIncome, User } from '../../../generated/prisma';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AnnualProjection, IncomesByCategory, IncomesDashboard, MonthlyGoal, SmartSummary } from './interfaces/income-dashboard.interface';
import { endOfMonth, getMonth, getYear, startOfMonth, subMonths } from 'date-fns';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/binary';
import { access } from 'fs';

@Injectable()
export class DashboardIncomesService {

  private readonly logger = new Logger(DashboardIncomesService.name)

  constructor(
    private readonly prisma: PrismaService
  ) { }

  /**
     * Get last 5 user's incomes
     * @param user 
     * @param paginationDto
     * @returns { data: { incomes: Income[], total: number } }
     */
  async getPaginatedIncomes(user: User, paginationDto: PaginationDto): Promise<{ data: { data: Income[], total: number } }> {

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

      return { data: { data: incomes, total } };

    } catch (error) {
      this.handleErrors(error)
    }

  }


  /**
   * Get all resources for incomes dashboard
   * @param userId 
   * @returns { data: IncomesDashboard }
   */
  async getIncomesDashboard(userId: string): Promise<{ data: IncomesDashboard }> {

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
        monthlyGoal,
        incomesByCategory
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
        this.prisma.income.groupBy({
          by: ['categoryId'],
          where: {
            userId,
            dateIncome: {
              gte: dateRanges.currentMonthStart,
              lte: dateRanges.currentMonthEnd
            }
          },
          _sum: { amount: true }
        })
      ])

      const currentMonthTotal = currentMonthTotalResult._sum.amount?.toNumber() || 0;
      const previousMonthTotal = previousMonthTotalResult._sum.amount?.toNumber() || 0;

      const smartSummary = await this._processSmartSummary(currentMonthTotal, previousMonthTotal, totalLast6MonthsResult._sum.amount?.toNumber() || 0, largestIncomeThisMonth, allRecurringIncomes);
      const monthlyGoalSummary = await this._processMonthlyGoal(monthlyGoal, currentMonthTotal);
      const annualProjection = await this._processAnnualProjection(allRecurringIncomes);
      const incomesByCategorySummary = await this._getIncomesByCategory(incomesByCategory)

      return {
        data: {
          smartSummary,
          monthlyGoal: monthlyGoalSummary,
          annualProjection,
          incomesByCategorySummary
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
  private async _processSmartSummary(
    currentMonthTotal: number,
    previousMonthTotal: number,
    totalLast6Months: number,
    largestIncome: Income | null,
    recurringIncomes: RecurringIncome[]
  ): Promise<SmartSummary> {

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
   * 
   * @param incomesByCategory 
   * @returns 
   */
  private async _getIncomesByCategory(incomesByCategory: (Prisma.PickEnumerable<Prisma.IncomeGroupByOutputType, "categoryId"[]> & {
    _sum: {
      amount: Prisma.Decimal | null;
    };
  })[]) : Promise<IncomesByCategory[] | null> {

    try {
      if (incomesByCategory.length === 0) {
        return null
      }

      const totalAmount = incomesByCategory.reduce((acc, current) => {
        const amountCurrent = current._sum.amount?.toNumber() ?? 0;
        const total = acc + amountCurrent;
        return total
      }, 0) || 1;

      const categoryIds = incomesByCategory.map(expense => expense.categoryId);

      const categories = await this.prisma.category.findMany({
        where: {
          id: {
            in: categoryIds
          }
        },
        select: {
          id: true,
          name: true,
          emoji: true,
          color: true
        }
      })

      const categoryDetailsMap = new Map(
        categories.map(category => [category.id, { name: category.name, emoji: category.emoji, color: category.color }])
      )

      const result = incomesByCategory.map(income => {

        const categoryDetails = categoryDetailsMap.get(income.categoryId);
        const categoryTotal = income._sum.amount?.toNumber() ?? 0;
        const percentage = (categoryTotal / totalAmount) * 100;

        return {
          categoryId: income.categoryId,
          name: categoryDetails?.name || 'Sin categoria',
          emoji: categoryDetails?.emoji || '❓',
          total: categoryTotal,
          color: categoryDetails?.color,
          percentage: parseFloat(percentage.toFixed(2))
        }
      })

      return result

    } catch (error) {
      this.handleErrors(error)
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
