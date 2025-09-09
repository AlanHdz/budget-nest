import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';
import { Budget } from '../../generated/prisma';

@Injectable()
export class BudgetService {

  private readonly logger = new Logger('AccountService')

  constructor(
    private prisma: PrismaService
  ) { }

  async create(userId: string, createBudgetDto: CreateBudgetDto) : Promise<{ data: Budget }> {

    const { amount, categoryId, month, year } = createBudgetDto

    try {

      const category = await this.prisma.category.findFirst({
        where: { id: categoryId, userId }
      })

      if (!category) {
        throw new NotFoundException(`Category with ID ${categoryId} not found for this user.`);
      }

      const budget = await this.prisma.budget.upsert({
        where: {
          userId_categoryId_month_year: {
            userId,
            categoryId,
            month,
            year
          }
        },
        update: {
          amount
        },
        create: {
          userId,
          categoryId,
          amount,
          month,
          year
        }
      })
      return { data: budget }

    } catch (error) {
      this.handleErrors(error)
    }

  }

  private handleErrors(error: any): never {

    this.logger.error(error);

    if (error instanceof HttpException) {
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
