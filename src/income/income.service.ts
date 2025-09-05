import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';
import { Frequency, Income, User } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { addMonths, addWeeks, addYears } from 'date-fns';

@Injectable()
export class IncomeService {

  private readonly logger = new Logger(IncomeService.name)

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

        return createdIncome

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
          },
          recurringIncome: {
            select: {
              id: true,
              frequency: true
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
   * Get all user's incomes
   * @param userId 
   */
  async findAll(userId: string): Promise<{ data: Income[] }> {

    try {

      const incomes = await this.prisma.income.findMany({
        where: { userId }
      })

      return { data: incomes }

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
