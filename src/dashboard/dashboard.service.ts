import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '../../generated/prisma';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';
import { ExpensesByCategoryMonthDto } from './dto/expenses-by-category-month.dto';
import { IncomesByCategoryMonthDto } from './dto/incomes-by-category-month.dto';
import { MovementDto } from './dto/movement.dto';
import { LimitLatestMovementsDto } from './dto/limit-latest-movements.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {

  private readonly logger = new Logger('DashboardService')

  constructor(
    private readonly prisma: PrismaService
  ) { }

  private MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];


  async getTotalBalance(user: User): Promise<Object> {

    try {

      const accountTotals = await this.prisma.account.aggregate({
        where: { userId: user.id },
        _sum: {
          balance: true
        },
        _count: {
          id: true
        }
      })

      return { totalBalance: accountTotals._sum.balance, totalAccounts: accountTotals._count.id, currency: 'MXN' }

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async getMonthlyFlow(user: User) {

    try {

      const date = new Date()
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)


      const incomesPromise = this.prisma.income.aggregate({
        where: {
          createdAt: {
            gte: firstDay,
            lte: lastDay
          },
          userId: user.id
        },
        _sum: {
          amount: true
        },
        
      })

      const expensesPromise = this.prisma.expense.aggregate({
        where: {
          createdAt: {
            gte: firstDay,
            lte: lastDay
          },
          userId: user.id
        },
        _sum: {
          amount: true
        }
      })

      const [incomesResult, expensesResult] = await Promise.all([
        incomesPromise,
        expensesPromise,
      ]);

      const totalIncomes = incomesResult._sum.amount?.toNumber() ?? 0;
      const totalExpenses = expensesResult._sum.amount?.toNumber() ?? 0;
      const netFlow = totalIncomes - totalExpenses;

      return {
        month: `${this.MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`,
        totalIncomes,
        totalExpenses,
        netFlow
      }

    } catch (error) {
      this.handleErrors(error)
    }
  }


  async getExpensesByCategoryMonthly(expensesByCategoryMonthDto: ExpensesByCategoryMonthDto, user: User) : Promise<Object> {

    try {

      const { month } = expensesByCategoryMonthDto;

      const date = new Date()
      const firstDay = new Date(date.getFullYear(), month, 1)
      const lastDay = new Date(date.getFullYear(), month + 1, 0);
      

      const expensesByCategory = await this.prisma.expense.groupBy({
        by: ['categoryId'],
        where: {
          userId: user.id,
          createdAt: {
            gte: firstDay,
            lte: lastDay
          }
        },
        _sum: {
          amount: true
        },
        
      })

      if (expensesByCategory.length === 0) {
        return { message: 'No se encontraron gastos', percentage: 0, total: 0 }
      }


      const totalAmount = expensesByCategory.reduce((acc, current) => {
        
        const amountCurrent = current._sum.amount?.toNumber() ?? 0

        const total = acc + amountCurrent

        return total

      }, 0) || 1;

      
      const categoryIds = expensesByCategory.map(expense => expense.categoryId);

      const categories = await this.prisma.category.findMany({
        where: {
          id: {
            in: categoryIds
          }
        },
        select: {
          id: true,
          name: true,
          emoji: true
        }
      })

      const categoryDetailsMap = new Map(
        categories.map(category => [category.id, { name: category.name, emoji: category.emoji }])
      )

      const result = expensesByCategory.map(expense => {

        const categoryDetails = categoryDetailsMap.get(expense.categoryId);
        const categoryTotal = expense._sum.amount?.toNumber() ?? 0;
        const percentage = (categoryTotal / totalAmount) * 100;

        return {
          categoryId: expense.categoryId,
          name: categoryDetails?.name || 'Sin categoria',
          emoji: categoryDetails?.emoji || '❓',
          total: categoryTotal,
          percentage: parseFloat(percentage.toFixed(2))
        }
      })

      return result;

    } catch (error) {
      this.handleErrors(error)
    }
    
  }

  async getIncomesByCategoryMonthly(incomesByCategoryMonthDto: IncomesByCategoryMonthDto, user: User) : Promise<Object> {

    try {
      const { month } = incomesByCategoryMonthDto;

      const date = new Date()
      const firstDay = new Date(date.getFullYear(), month, 1)
      const lastDay = new Date(date.getFullYear(), month + 1, 0);
      

      const expensesByCategory = await this.prisma.income.groupBy({
        by: ['categoryId'],
        where: {
          userId: user.id,
          createdAt: {
            gte: firstDay,
            lte: lastDay
          }
        },
        _sum: {
          amount: true
        },
        
      })

      if (expensesByCategory.length === 0) {
        return { message: 'No se encontraron ingresos en el mes seleccionado', percentage: 0, total: 0 }
      }


      const totalAmount = expensesByCategory.reduce((acc, current) => {
        
        const amountCurrent = current._sum.amount?.toNumber() ?? 0

        const total = acc + amountCurrent

        return total

      }, 0) || 1;

      
      const categoryIds = expensesByCategory.map(expense => expense.categoryId);

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

      const result = expensesByCategory.map(expense => {

        const categoryDetails = categoryDetailsMap.get(expense.categoryId);
        const categoryTotal = expense._sum.amount?.toNumber() ?? 0;
        const percentage = (categoryTotal / totalAmount) * 100;

        return {
          categoryId: expense.categoryId,
          name: categoryDetails?.name || 'Sin categoria',
          emoji: categoryDetails?.emoji || '❓',
          total: categoryTotal,
          color: categoryDetails?.color,
          percentage: parseFloat(percentage.toFixed(2))
        }
      })

      return result;

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async getLatestMovements(limitLatestMovementsDto: LimitLatestMovementsDto, user: User) : Promise<MovementDto[]> {

    try {
      const result = await this.prisma.$queryRaw<MovementDto[]>(Prisma.sql`
        SELECT * FROM (
          SELECT id, amount, description, "createdAt", 'income' as type
          FROM "Income"
          WHERE "userId" = ${user.id}::uuid
          UNION ALL
          SELECT id, amount, description, "createdAt", 'expense' as type
          FROM "Expense"
          WHERE "userId" = ${user.id}::uuid
        ) as movements
        ORDER BY "createdAt" DESC
        LIMIT 10
      `)

      return result; 
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
      throw new NotFoundException('No se encontro lo que buscabas.');
    }

    throw new InternalServerErrorException(error)
  }

}
