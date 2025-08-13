import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';
import { Frequency, Goal, GoalType, Income, User } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { addMonths, addWeeks, addYears, endOfMonth, startOfMonth, subMonths, subWeeks, subYears } from 'date-fns';
import { GoalsService } from '../goals/goals.service';
import { SmartSummary } from './interfaces/smart-summary.interface';
import { MonthlyGoal } from './interfaces/monthly-goal.interface';
import { AnnualProjection } from './interfaces/annual-projection.interface';

@Injectable()
export class IncomeService {

  private readonly logger = new Logger('IncomeService')

  constructor(
    private readonly prisma: PrismaService,
    private readonly goalsService: GoalsService
  ) { }

  /**
   * Crea un ingreso
   * 
   * @param createIncomeDto
   * @param user 
   * @returns {Promise<Income>}
   */
  async create(createIncomeDto: CreateIncomeDto, user: User): Promise<Income> {

    try {


      const { accountId, amount, recurringIncomeId } = createIncomeDto;

      const account = await this.prisma.account.findFirst({
        where: { id: accountId, userId: user.id }
      })

      if (!account || account.userId !== user.id) {
        throw new NotFoundException(`La cuenta con ID ${accountId} no fue encontrada`)
      }

      return this.prisma.$transaction(async (prismaTx) => {

        const newIncome = await prismaTx.income.create({
          data: {
            ...createIncomeDto,
            userId: user.id
          }
        })

        await prismaTx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: amount
            }
          }
        })

        if (recurringIncomeId) {

          const recurringIncome = await prismaTx.recurringIncome.findUnique({
            where: { id: recurringIncomeId }
          })

          if (!recurringIncome || recurringIncome.userId !== user.id) {
            throw new NotFoundException(`Ingreso recurrente con ID "${recurringIncomeId}" no encontrado.`);
          }

          const newNextDate = this.calculateNextDate(
            recurringIncome.nextDate,
            recurringIncome.frequency
          )

          await prismaTx.recurringIncome.update({
            where: { id: recurringIncomeId },
            data: {
              nextDate: newNextDate
            }
          })

        }

        return newIncome

      })

    } catch (error) {

      this.handleErrors(error)
    }

  }

  /**
   * Obtiene todos los ingresos del usuario autenticado
   * @param user 
   * @returns {Promise<Income[]>}
   */
  async findAll(user: User): Promise<Income[]> {

    try {

      const incomes = await this.prisma.income.findMany({
        where: { userId: user.id },
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

      return incomes;

    } catch (error) {
      this.handleErrors(error)
    }

  }

  /**
   * Obtiene un ingreso del usuario autenticado
   * @param id 
   * @param user 
   * @returns {Promise<Income>}
   */
  async findOne(id: string, user: User): Promise<Income> {

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

      return income;

    } catch (error) {
      this.handleErrors(error)
    }


  }

  /**
   * Actualiza el ingreso de un usuario en especifico
   * @param id 
   * @param updateIncomeDto 
   * @param user 
   * @returns {Promise<Income>}
   */
  async update(id: string, updateIncomeDto: UpdateIncomeDto, user: User): Promise<Income> {

    try {

      const { accountId, amount } = updateIncomeDto;

      const incomeOriginal = await this.prisma.income.findFirst({
        where: { id: id, userId: user.id }
      })

      if (!incomeOriginal) {
        throw new NotFoundException('Income not found')
      }

      return this.prisma.$transaction(async (prismaTx) => {

        await prismaTx.account.update({
          where: { id: incomeOriginal.accountId },
          data: { balance: { decrement: incomeOriginal.amount } }
        })

        const newAmount = updateIncomeDto.amount ?? incomeOriginal.amount
        const newAccountId = updateIncomeDto.accountId ?? incomeOriginal.accountId
        await prismaTx.account.update({
          where: { id: newAccountId },
          data: { balance: { increment: newAmount } }
        })

        const oldRecurringId = incomeOriginal.recurringIncomeId;
        const newRecurringId = updateIncomeDto.recurringIncomeId;

        // Solo actuamos si el vínculo ha cambiado.
        if (oldRecurringId !== newRecurringId) {

          // Si antes estaba vinculado a algo, debemos revertir la fecha de ese ingreso recurrente.
          if (oldRecurringId) {
            const oldRecurringIncome = await prismaTx.recurringIncome.findUnique({ where: { id: oldRecurringId } })

            if (oldRecurringIncome) {
              const revertedDate = this.calculatePreviousDate(oldRecurringIncome.nextDate, oldRecurringIncome.frequency)
              await prismaTx.recurringIncome.update({
                where: { id: newRecurringId },
                data: { nextDate: revertedDate }
              })
            }

          }

          // Si ahora se está vinculando a algo nuevo, debemos avanzar la fecha de ese nuevo ingreso recurrente.
          if (newRecurringId) {
            const newRecurringIncome = await prismaTx.recurringIncome.findUnique({ where: { id: newRecurringId } })
            if (newRecurringIncome) {
              const advancedDate = this.calculateNextDate(newRecurringIncome.nextDate, newRecurringIncome.frequency)
              await prismaTx.recurringIncome.update({
                where: { id: newRecurringId },
                data: { nextDate: advancedDate }
              })
            }
          }

        }

        const updatedIncome = await prismaTx.income.update({
          where: { id: id },
          data: {
            ...updateIncomeDto
          }
        })

        return updatedIncome;
      })

    } catch (error) {
      this.handleErrors(error)
    }

  }

  /**
   * Remueve el ingreso de un usuario en especifico
   * @param id 
   * @param user 
   * @returns {Promise<Object>}
   */
  async remove(id: string, user: User): Promise<Object> {

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

    return { message: 'Income deleted successfully', status: HttpStatus.OK }

  }

  /**
   * Obtiene los ultimos 10 ingresos del usuario
   * @param user 
   * @returns {Promise<Income[]>}
   */
  async getLatestMovements(user: User): Promise<Income[]> {

    try {

      const incomes = await this.prisma.income.findMany({
        where: { userId: user.id },
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
        take: 10
      })

      return incomes;

    } catch (error) {
      this.handleErrors(error)
    }

  }

  /**
   * Obtiene el resumen inteligente de un usuario
   * @param userId 
   * @returns {Promise<SmartSummary>}
   */
  async getSmartSummary(userId: string) : Promise<SmartSummary> {

    try {

      const today = new Date()
      const currentMonthStart = startOfMonth(today)
      const currentMonthEnd = endOfMonth(today)
      const previousMonthStart = startOfMonth(subMonths(today, 1))
      const previousMonthEnd = endOfMonth(subMonths(today, 1))


      const [
        largestIncomeThisMonth,
        recurringIncomes,
        totalLast6Months,
      ] = await Promise.all([
        // Fuente de ingresos mas grande del mes actual
        this.prisma.income.findFirst({
          where: { userId, createdAt: { gte: currentMonthStart, lte: currentMonthEnd } },
          orderBy: { amount: 'desc' }
        }),
        // Todos los ingresos recurrentes del usuario
        this.prisma.recurringIncome.findMany({
          where: { userId },
          orderBy: { nextDate: 'asc' }
        }),
        // Total de ingresos de los ultimos 6 meses para el promedio
        this.prisma.income.aggregate({
          where: { userId, createdAt: { gte: subMonths(today, 6) } },
          _sum: { amount: true }
        })
      ])

      // Total de ingresos del mes actual
      const currentMonthTotal =  await this.getCurrentMonthIncome(currentMonthStart, currentMonthEnd, userId);

      // Total de ingresos del mes anterior
      const previousMonthTotal = await this.getPreviousMonthIncome(previousMonthStart, previousMonthEnd, userId);

      // Tendencia
      let trend = 0
      if (previousMonthTotal > 0) {
        trend = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
      } else if (currentMonthTotal > 0) {
        trend = 100;
      }

      // Ingreso promedio mensual
      const totalForAverage = totalLast6Months._sum.amount?.toNumber() || 0;
      const averageMontlyIncome = totalForAverage / 6;

      // Proximo ingreso esperado
      const nextExpectedIncome = recurringIncomes.find(ri => ri.nextDate >= today)

      const smartSummary = {
        averageMonthlyIncome: parseFloat(averageMontlyIncome.toFixed(2)),
        largestSource: {
          name: largestIncomeThisMonth?.title || 'N/A',
          amount: largestIncomeThisMonth?.amount?.toNumber() || 0
        },
        nextExpectedIncome: {
          name: nextExpectedIncome?.title || 'N/A',
          amount: nextExpectedIncome?.amount?.toNumber() || 0
        },
        trend: {
          percentage: parseFloat(trend.toFixed(1)),
          vs: 'mes anterior'
        }
      }

      return smartSummary

    } catch (error) {
      this.handleErrors(error)
    }

  }

  /**
   * Obtiene la meta mensual de los ingresos de un usuario
   * @param userId 
   * @returns {Promise<MonthlyGoal>}
   */
  async getMonthlyGoal(userId: string) : Promise<MonthlyGoal> {

    try {

      const today = new Date();
      const currentMonthStart = startOfMonth(today);
      const currentMonthEnd = endOfMonth(today);

      let monthlyGoal: Goal | null = null

      monthlyGoal = await this.goalsService.findOneByProperties(
        userId,
        GoalType.INCOME,
        today.getMonth() + 1,
        today.getFullYear(),
      )

      // a) Total de Ingresos del Mes Actual
      const currentMonthTotal = await this.getCurrentMonthIncome(currentMonthStart, currentMonthEnd, userId);

      // Meta mensual
      const goalAmount = monthlyGoal?.amount?.toNumber() || 0;
      const goalPercentage = goalAmount > 0 ? (currentMonthTotal / goalAmount) * 100 : 0;
      const monthlyGoalSummary = {
        progress: currentMonthTotal,
        goal: goalAmount,
        percentageCompleted: parseFloat(goalPercentage.toFixed(1)),
        remaining: Math.max(0, goalAmount - currentMonthTotal),
      };

      return monthlyGoalSummary

    } catch (error) {
      this.handleErrors(error)
    }

  }
  
  /**
   * Obtiene la proyeccion anual de los ingresos de un usuario
   * @param userId 
   * @returns {Promise<AnnualProjection>}
   */
  async getAnnualProjection(userId: string) : Promise<AnnualProjection> {

    try {
      
      const recurringIncomes = await this.prisma.recurringIncome.findMany({
        where: { userId },
        orderBy: { nextDate: 'asc' }
      })

      const monthlyRecurringTotal = recurringIncomes.reduce((sum, item) => sum + item.amount.toNumber(), 0)

      const annualProjection = {
        recurringMonthlyIncome: monthlyRecurringTotal,
        projectedAnnualIncome: monthlyRecurringTotal * 12,
        upcomingRecurringIncomes: recurringIncomes.map(ri => ({
          title: ri.title,
          amount: ri.amount.toNumber()
        }))
      }

      return annualProjection;

    } catch (error) {
      this.handleErrors(error)
    }

  }

  /**
   * Obtiene el total de ingresos del mes actual
   * @param currentMonthStart 
   * @param currentMonthEnd 
   * @param userId 
   * @returns {Promise<number>}
   */
  private async getCurrentMonthIncome(currentMonthStart: Date, currentMonthEnd: Date, userId: string) : Promise<number> {

    try {
      const currentMonthIncomeRecords = (await this.prisma.income.findMany({ where: { userId, createdAt: { gte: currentMonthStart, lte: currentMonthEnd } } }));
      const currentMonthTotal = currentMonthIncomeRecords.reduce((sum, income) => sum + income.amount.toNumber(), 0);

      return currentMonthTotal
    } catch (error) {
      this.handleErrors(error)
    }
  }

  /**
   * Obtiene el total de ingresos del mes anterior
   * @param previousMonthStart 
   * @param previousMonthEnd 
   * @param userId 
   * @returns {Promise<number>}
   */
  private async getPreviousMonthIncome(previousMonthStart: Date, previousMonthEnd: Date, userId: string) : Promise<number> {
    try {
      const previousMonthIncomeRecords = (await this.prisma.income.findMany({ where: { userId, createdAt: { gte: previousMonthStart, lte: previousMonthEnd } } }));
      const previousMonthTotal = previousMonthIncomeRecords.reduce((sum, income) => sum + income.amount.toNumber(), 0);
      return previousMonthTotal
    } catch (error) {
      this.handleErrors(error)
    }
  }

  private calculateNextDate(currentNexDate: Date, frequency: Frequency): Date {

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

  private calculatePreviousDate(currentNextDate: Date, frequency: Frequency): Date {
    switch (frequency) {
      case 'MONTHLY': return subMonths(currentNextDate, 1);
      case 'WEEKLY': return subWeeks(currentNextDate, 1);
      case 'BIWEEKLY': return subWeeks(currentNextDate, 2);
      case 'YEARLY': return subYears(currentNextDate, 1);
      default: return currentNextDate;
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
