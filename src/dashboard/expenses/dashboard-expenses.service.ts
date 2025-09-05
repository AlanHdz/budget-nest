import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Expense, Frequency, Prisma } from '../../../generated/prisma';
import { BudgetVsExpense, DashboardInterface, ExpenseByCategory, SubscriptionDetail } from './interfaces/expense-dashboard.interface';
import { endOfMonth, getMonth, getYear, startOfMonth, subMonths } from 'date-fns';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/binary';

@Injectable()
export class DashboardExpensesService {

  private readonly logger = new Logger(DashboardExpensesService.name)

  constructor (
    private readonly prisma: PrismaService
  ) {}

  /**
     * Get last 5 user's expenses
     * @param userId 
     * @param paginationDto 
     * @returns 
     */
  async getPaginatedExpenses(userId: string, paginationDto: PaginationDto): Promise<{ data: { expenses: Expense[], total: number } }> {
    try {

      const { page = 1, limit = 5, search } = paginationDto
      const skip = (page - 1) * limit

      const whereCondition: Prisma.ExpenseWhereInput = {
        userId: userId
      }

      if (search) {
        whereCondition.title = {
          contains: search,
          mode: 'insensitive',
        };
      }

      const [expenses, total] = await Promise.all([
        this.prisma.expense.findMany({
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
        this.prisma.expense.count({
          where: whereCondition,
        }),
      ])

      return { data: { expenses, total: total } };

    } catch (error) {
      this.handleErrors(error)
    }
  }

  /**
   * Get all resource for expenses dashboard
   * @param userId 
   * @returns 
   */
  async getDashboardExpenses(userId: string): Promise<{ data: DashboardInterface } | undefined> {
    try {

      const now = new Date();

      const dateRanges = {
        currentMonthStart: startOfMonth(now),
        currentMonthEnd: endOfMonth(now),
        prevMonthStart: startOfMonth(subMonths(now, 1)),
        prevMonthEnd: endOfMonth(subMonths(now, 1))
      }

      const [
        totalExpensesData,
        subscriptionSummaryData,
        expensesByCategoryData,
        budgetData,
        subscriptionDetailData
      ] = await Promise.all([
        this._calculateTotalExpenses(userId, dateRanges),
        this._calculateSubscriptionSummary(userId),
        this._calculateExpensesByCategory(userId, dateRanges),
        this._calculateBudgetVsExpenses(userId, now, dateRanges.currentMonthStart, dateRanges.currentMonthEnd),
        this._getSubscriptionListAndProjection(userId)
      ])

      const { totalBudget, budgetVsExpenses } = budgetData;
      const remainingBudget = totalBudget - totalExpensesData.amount;

      return {
        data: {
          summary: {
            totalExpenses: totalExpensesData,
            subscriptions: subscriptionSummaryData,
            remainingBudget: {
              amount: remainingBudget,
              totalBudget: totalBudget,
              percentageAvailable: totalBudget > 0 ? (remainingBudget / totalBudget) * 100 : 0,
            }
          },
          expensesByCategory: expensesByCategoryData,
          budgetVsExpenses: budgetVsExpenses,
          subscriptionDetails: subscriptionDetailData
        }
      }

    } catch (error) {

    }
  }

  /**
   * Processes the data for calculate total expenses
   * @param userId 
   * @param ranges 
   * @returns { amount: number, percentageChange: number }
   */
  private async _calculateTotalExpenses(userId: string, ranges: {
    currentMonthStart: Date,
    currentMonthEnd: Date,
    prevMonthStart: Date,
    prevMonthEnd: Date
  }): Promise<{ amount: number, percentageChange: number }> {
    try {

      const currentPromise = this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: { userId, dateExpense: { gte: ranges.currentMonthStart, lte: ranges.currentMonthEnd } }
      })

      const previousPromise = this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: { userId, dateExpense: { gte: ranges.prevMonthStart, lte: ranges.prevMonthEnd } }
      })

      const [currentResult, previousResult] = await Promise.all([currentPromise, previousPromise])
      const currentAmount = currentResult._sum.amount?.toNumber() || 0;
      const previousAmount = previousResult._sum.amount?.toNumber() || 0;

      let percentageChange = 0;
      if (previousAmount > 0) {
        percentageChange = ((currentAmount - previousAmount) / previousAmount) * 100;
      }

      return { amount: currentAmount, percentageChange }

    } catch (error) {
      this.handleErrors(error)
    }
  }

  /**
   * Processes the data for calculate subscription summary
   * @param userId 
   * @returns { monthlyTotal: number, monthlyCount: number }
   */
  private async _calculateSubscriptionSummary(userId: string): Promise<{ monthlyTotal: number, monthlyCount: number }> {

    try {

      const result = await this.prisma.recurringExpense.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { userId }
      })

      return {
        monthlyTotal: result._sum.amount?.toNumber() || 0,
        monthlyCount: result._count.id || 0
      }

    } catch (error) {
      this.handleErrors(error)
    }

  }

  /**
   * Processes the data for calculate expenses by category
   * @param userId
   * @param ranges 
   * @returns { ExpenseByCategory[] }
   */
  private async _calculateExpensesByCategory(userId: string, ranges: {
    currentMonthStart: Date,
    currentMonthEnd: Date,
    prevMonthStart: Date,
    prevMonthEnd: Date
  }): Promise<ExpenseByCategory[]> {

    try {

      const expensesGrouped = await this.prisma.expense.groupBy({
        by: ['categoryId'],
        _sum: { amount: true },
        where: { userId, dateExpense: { gte: ranges.currentMonthStart, lte: ranges.currentMonthEnd } }
      })

      const totalExpenses = expensesGrouped.reduce((sum, item) => {
        const total = item._sum.amount?.toNumber() || 0;
        return sum + total;
      }, 0);

      const categories = await this.prisma.category.findMany({
        where: { id: { in: expensesGrouped.map(e => e.categoryId) } }
      })

      const categoryMap = new Map(categories.map(c => [c.id, c]))

      return expensesGrouped.map(item => {
        const category = categoryMap.get(item.categoryId)
        const amount = item._sum.amount?.toNumber() || 0

        return {
          categoryId: category?.id,
          name: category?.name,
          color: category?.color,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
        }

      })

    } catch (error) {
      this.handleErrors(error)
    }

  }

  /**
  * Processes the data for calculate subscription list and projection annual
  * @param userId 
  * @returns { list: SubscriptionDetail[], projectedAnnualExpense: number }
  */
  private async _getSubscriptionListAndProjection(userId: string): Promise<{ list: SubscriptionDetail[], projectedAnnualExpense: number }> {

    try {

      const subscriptions = await this.prisma.recurringExpense.findMany({
        where: { userId },
        include: { category: { select: { id: true, name: true } } }
      })

      let projectedAnnualExpense = 0;
      const multiplier = {
        [Frequency.WEEKLY]: 52,
        [Frequency.BIWEEKLY]: 26,
        [Frequency.MONTHLY]: 12,
        [Frequency.YEARLY]: 1,
      }

      subscriptions.forEach(sub => {
        projectedAnnualExpense += sub.amount.toNumber() * (multiplier[sub.frequency] || 0)
      })

      return {
        list: subscriptions.map(s => ({ ...s, amount: s.amount.toNumber() })),
        projectedAnnualExpense
      }


    } catch (error) {
      this.handleErrors(error)
    }
  }

  /**
   * Processes the data for calculate budget vs expenses
   * @param userId 
   * @param date
   * @param startDate
   * @param endDate
   * @returns { totalBudget: number, budgetVsExpenses: BudgetVsExpense[] }
   */
  private async _calculateBudgetVsExpenses(userId: string, 
    date: Date, 
    startDate: Date, 
    endDate: Date
  ): Promise<{ totalBudget: number, budgetVsExpenses: BudgetVsExpense[] }> {

    try {

      const budgetsPromise = this.prisma.budget.findMany({
        where: { userId, year: getYear(date), month: getMonth(date) + 1 },
        include: { category: { select: { name: true, color: true } } }
      })

      const expensePromise = this.prisma.expense.groupBy({
        by: ['categoryId'],
        _sum: { amount: true },
        where: { userId, dateExpense: { gte: startDate, lte: endDate } }
      })

      const [budgets, expenses] = await Promise.all([budgetsPromise, expensePromise])
      const totalBudget = budgets.reduce((sum, b) => sum + b.amount.toNumber(), 0)

      const budgetVsExpenses = budgets.map(budget => {
        const spent = expenses.find(e => e.categoryId === budget.categoryId)?._sum.amount?.toNumber() || 0
        const budgetAmount = budget.amount.toNumber()

        return {
          categoryId: budget.categoryId,
          name: budget.category.name,
          color: budget.category.color,
          spent,
          budget: budgetAmount,
          remaining: budgetAmount - spent,
          percentage: budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0,
        }

      })

      return { totalBudget, budgetVsExpenses }

    } catch (error) {
      this.handleErrors(error)
    }

  }

  private handleErrors(error: any): never {

    if (error.response) {
      throw new InternalServerErrorException(error.response)
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
