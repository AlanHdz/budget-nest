import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense, Frequency, Prisma, User } from '../../generated/prisma';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { addMonths, addWeeks, addYears, endOfMonth, getMonth, getYear, startOfMonth, subMonths } from 'date-fns';
import { BudgetVsExpense, DashboardInterface, ExpenseByCategory, SubscriptionDetail } from './interfaces/expense-dashboard.interface';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ExpenseService {

  private readonly logger = new Logger('ExpenseService');

  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(createExpenseDto: CreateExpenseDto, user: User): Promise<{ data: Expense }> {

    try {

      const { isRecurring, frequency, ...expenseData } = createExpenseDto;

      const { accountId, amount } = expenseData;

      const account = await this.prisma.account.findFirst({
        where: { id: accountId, userId: user.id }
      })

      if (!account) {
        throw new NotFoundException(`La cuenta no fue encuentrada`);
      }

      if (account.balance.toNumber() < Number(amount)) {
        throw new BadRequestException(`Saldo insuficiente en la cuenta ${account.name} para este gasto`);
      }

      if (isRecurring && !frequency) {
        throw new BadRequestException('La frecuencia es requerida para gastos recurrents.')
      }

      const newExpense = await this.prisma.$transaction(async (prismaTx) => {

        await prismaTx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              decrement: amount
            }
          }
        })

        let newExpense: Expense;
        //Si es recurrente añadimos la frecuencia y creamos un record en recurringExpense y lo asociamos al expense, si no solo es un gasto
        if (isRecurring) {
          const startDate = expenseData.dateExpense ? new Date(expenseData.dateExpense) : new Date();
          const nextDueDate = this._calculateNextDueDate(startDate, frequency)

          const recurringExpense = await prismaTx.recurringExpense.create({
            data: {
              title: expenseData.title,
              amount: expenseData.amount,
              frequency: frequency ?? Frequency.BIWEEKLY,
              startDate: startDate,
              nextDueDate: nextDueDate,
              userId: user.id,
              accountId: accountId,
              categoryId: expenseData.categoryId
            }
          })

          newExpense = await prismaTx.expense.create({
            data: {
              ...expenseData,
              userId: user.id,
              dateExpense: startDate,
              recurringExpenseId: recurringExpense.id
            },
            include: {
              account: { select: { id: true, name: true, type: true } },
              category: { select: { id: true, name: true } }
            }
          })

        } else {
          newExpense = await prismaTx.expense.create({
            data: {
              ...expenseData,
              userId: user.id
            },
            include: {
              account: { select: { id: true, name: true, type: true } },
              category: { select: { id: true, name: true } }
            }
          })
        }

        return newExpense;

      })

      return { data: newExpense }

    } catch (error) {
      this.handleErrors(error)
    }

  }


  async findOne(id: string, user: User): Promise<{ data: Expense }> {

    try {

      const expense = await this.prisma.expense.findUnique({
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

      if (!expense) {
        throw new NotFoundException('Gasto no encontrado')
      }

      return { data: expense };

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto, user: User): Promise<{ data: Expense }> {

    try {

      const { isRecurring, frequency, ...expenseData } = updateExpenseDto;

      const expenseOriginal = await this.prisma.expense.findFirst({
        where: { id: id, userId: user.id }
      })

      if (!expenseOriginal) {
        throw new NotFoundException(`El gasto solicitado no fue encontrado`)
      }

      //Validacion para la recurrencia
      const isBecomingRecurring = isRecurring === true && !expenseOriginal.recurringExpenseId

      if (isBecomingRecurring && !frequency) {
        throw new BadRequestException('La frecuencia es requerida para convertir un gasto recurrente')
      }

      //Transacciones para disminuir el monto y aplicar si es un gasto recurrente o no
      const expense = await this.prisma.$transaction(async (prismaTx) => {

        await prismaTx.account.update({
          where: { id: expenseOriginal.accountId },
          data: {
            balance: {
              increment: expenseOriginal.amount
            }
          }
        })

        const newAmount = updateExpenseDto.amount ?? expenseOriginal.amount;
        const newAccountId = updateExpenseDto.accountId ?? expenseOriginal.accountId;

        const targetAccount = await prismaTx.account.findUnique({ where: { id: newAccountId } })

        if (!targetAccount) {
          throw new NotFoundException(`La cuenta destino no fue encontrada`)
        }

        if (targetAccount.balance.toNumber() < Number(newAmount)) {
          throw new BadRequestException(`Saldo insuficiente en la cuenta de destino para actualizar el gasto.`);
        }

        await prismaTx.account.update({
          where: { id: updateExpenseDto.accountId },
          data: {
            balance: {
              decrement: updateExpenseDto.amount
            }
          }
        })

        const dataForUpdate: any = { ...expenseData }

        /* CASO 1 : Convertir un gasto simple a recurrente */
        if (isRecurring === true && !expenseOriginal.recurringExpenseId) {
          const startDate = expenseOriginal.createdAt;
          const nextDueDate = this._calculateNextDueDate(startDate, frequency);

          const newRecurringExpense = await prismaTx.recurringExpense.create({
            data: {
              title: expenseData.title || expenseOriginal.title,
              amount: newAmount,
              frequency: frequency ?? Frequency.MONTHLY,
              startDate,
              nextDueDate,
              userId: user.id,
              accountId: newAccountId,
              categoryId: expenseData.categoryId || expenseOriginal.categoryId
            }
          })

          dataForUpdate.recurringExpenseId = newRecurringExpense.id
        }
        /* CASO 2 :  Cancelar la recurrencia de un gasto */
        else if (isRecurring === false && expenseOriginal.recurringExpenseId) {
          await prismaTx.recurringExpense.delete({
            where: { id: expenseOriginal.recurringExpenseId }
          })
          dataForUpdate.recurringExpenseId = null;
        }

        const expense = await prismaTx.expense.update({
          where: { id: id },
          data: dataForUpdate,
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

        return expense;

      })

      return { data: expense }

    } catch (error) {
      this.handleErrors(error)
    }
  }

  async remove(id: string, user: User): Promise<void> {

    try {

      const expense = await this.prisma.expense.findFirst({
        where: { id: id, userId: user.id }
      })

      if (!expense) {
        throw new NotFoundException(`El gasto no fue encontrado`)
      }

      this.prisma.$transaction(async (prismaTx) => {

        await prismaTx.account.update({
          where: { id: expense.accountId },
          data: {
            balance: {
              increment: expense.amount
            }
          }
        })

        await prismaTx.expense.delete({
          where: { id: id, userId: user.id }
        })

      })

    } catch (error) {
      this.handleErrors(error)
    }

  }

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
  private async _calculateBudgetVsExpenses(userId: string, date: Date, startDate: Date, endDate: Date): Promise<{ totalBudget: number, budgetVsExpenses: BudgetVsExpense[] }> {

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

  /**
   * Calculate the next due date for expense
   * @param startDate 
   * @param frequency 
   * @returns { Date }
   */
  private _calculateNextDueDate(startDate: Date, frequency: string | undefined): Date {
    switch (frequency) {
      case Frequency.WEEKLY:
        return addWeeks(startDate, 1);
      case Frequency.BIWEEKLY:
        return addWeeks(startDate, 2);
      case Frequency.MONTHLY:
        return addMonths(startDate, 1)
      case Frequency.YEARLY:
        return addYears(startDate, 1)
      default:
        throw new BadRequestException('Frecuencia de recurrencia inválida');
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
