import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';
import { Income, User } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IncomeService {
  
  private readonly logger = new Logger('IncomeService')

  constructor(
    private readonly prisma: PrismaService
  ) {}

  async create(createIncomeDto: CreateIncomeDto, user: User) : Promise<Income> {
    
    try {

      const { accountId, amount } = createIncomeDto;

      const account = await this.prisma.account.findFirst({
        where: { id: accountId, userId: user.id }
      })

      if (!account) {
        throw new NotFoundException(`La cuenta con ID ${accountId} no fue encontrada`)
      }

      return this.prisma.$transaction(async (prismaTx) => {

        const updatedAccount = await prismaTx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: amount
            }
          }
        })

        const newIncome = await prismaTx.income.create({
          data: {
            ...createIncomeDto,
            userId: user.id
          }
        })

        return newIncome

      })

    } catch (error) {
      
      this.handleErrors(error)
    }

  }

  async findAll(user: User) : Promise<Income[]> {
  
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

  async findOne(id: string, user: User) : Promise<Income> {

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

  async update(id: string, updateIncomeDto: UpdateIncomeDto, user: User) : Promise<Income> {
    
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
          data: {
            balance: {
              decrement: incomeOriginal.amount
            }
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

        const updateIncome = await prismaTx.income.update({
          where: { id, userId: user.id },
          data: {
            ...updateIncomeDto,
          }
        })

        return updateIncome

      })

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async remove(id: string, user: User) : Promise<Object> {
      
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

  private handleErrors(error: any) : never {
    
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
