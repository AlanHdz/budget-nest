import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense, User } from '../../generated/prisma';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpenseService {

  private readonly logger = new Logger('ExpenseService');

  constructor(
    private readonly prisma: PrismaService
  ) {}
  
  async create(createExpenseDto: CreateExpenseDto, user: User) : Promise<Expense> {
    
    try {
      
      const { accountId, amount } = createExpenseDto;

      const account = await this.prisma.account.findFirst({
        where: { id: accountId, userId: user.id }
      })

      if (!account) {
        
        throw new NotFoundException(`La cuenta no fue encuentrada`);

      }

      if (account.balance.toNumber() < Number(amount)) {
        throw new BadRequestException(`Saldo insuficiente en la cuenta ${account.name} para este gasto`);
      }

      return this.prisma.$transaction(async (prismaTx) => {

        await prismaTx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              decrement: amount
            }
          }
        })

        const newExpense = await prismaTx.expense.create({
          data: {
            ...createExpenseDto,
            userId: user.id
          },
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

        return newExpense

      })

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async findAll(user: User) : Promise<Expense[]> {
    
    try {

      const expenses = await this.prisma.expense.findMany({
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
      
      return expenses;

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async findOne(id: string, user) : Promise<Expense> {
  
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

      return expense;

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto, user: User) : Promise<Expense> {
    
    try {

      const { amount } = updateExpenseDto;
      console.log(typeof amount);
      
      const expenseOriginal = await this.prisma.expense.findFirst({
        where: { id: id, userId: user.id }
      })

      if (!expenseOriginal) {
        throw new NotFoundException(`El gasto solicitado no fue encontrado`)
      }

      return this.prisma.$transaction(async (prismaTx) => {

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

        const account = await prismaTx.account.findUnique({ where: { id: newAccountId } })

        if (!account) {
          throw new NotFoundException(`La cuenta destino no fue encontrada`)
        }

        if (account.balance < newAmount) {
          throw new BadRequestException(`Saldo insuficiente en la cuenta de destino para actualizar el gasto.`);
        }

        const accountUpdate = await prismaTx.account.update({
          where: { id: updateExpenseDto.accountId },
          data: {
            balance: {
              decrement: updateExpenseDto.amount
            }
          }
        })


        const expense = await prismaTx.expense.update({
          where: { id: id },
          data: {
            ...updateExpenseDto
          },
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
      
    } catch (error) {
      this.handleErrors(error)
    }
  }

  async remove(id: string, user: User) : Promise<Object> {
    
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

      return { message: 'Gasto eliminado correctamente.', status: HttpStatus.OK }

    } catch (error) {
      this.handleErrors(error)  
    }

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
