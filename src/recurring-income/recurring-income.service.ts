import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringIncomeDto } from './dto/create-recurring-income.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class RecurringIncomeService {

  private readonly logger = new Logger('RecurringIncomeService')

  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(userId: string, createRecurringIncomeDto: CreateRecurringIncomeDto) {

    try {

      const { accountId, categoryId, firstPaymentDate, ...rest } = createRecurringIncomeDto

      const account = await this.prisma.account.findFirst({
        where: { id: accountId, userId: userId }
      })

      if (!account) {
        throw new BadRequestException(`La cuenta con ID ${accountId} no es válida o no te pertenece.`)
      }

      const category = await this.prisma.category.findFirst({
        where: { id: categoryId, userId: userId }
      })

      if (!category) {
        throw new BadRequestException(`La categoria con ID  ${categoryId} no es válida o no te pertenece.`)
      }

      if (category.type !== 'INCOME') {
        throw new BadRequestException('La categoría seleccionada debe ser de tipo "INCOME".')
      }

      const newRecurringIncome = await this.prisma.recurringIncome.create({
        data: {
          ...rest,
          categoryId: categoryId,
          accountId: accountId,
          startDate: firstPaymentDate,
          nextDate: firstPaymentDate,
          userId: userId
        }
      })

      return newRecurringIncome;

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async findAll(userId: string) {

    try {
      
      return await this.prisma.recurringIncome.findMany({
        where: { userId },
        orderBy: { nextDate: 'asc' }
      })

    } catch (error) {
      this.handleErrors(error)
    }

  }

  private handleErrors(error: any): never {

    if (error.response) {
      throw error;
    }

    this.logger.error(error);

    if (error instanceof BadRequestException) {
      throw error;
    }

    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('The category does not exist or does not belong to you');
    }

    throw new InternalServerErrorException(error)
  }

}
