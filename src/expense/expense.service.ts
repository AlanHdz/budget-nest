import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense, User } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

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
          }
        })

        return newExpense

      })

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async findAll(user: User) {
    
    try {
      
      

    } catch (error) {
      this.handleErrors(error)
    }

  }

  findOne(id: number) {
    return `This action returns a #${id} expense`;
  }

  update(id: number, updateExpenseDto: UpdateExpenseDto) {
    return `This action updates a #${id} expense`;
  }

  remove(id: number) {
    return `This action removes a #${id} expense`;
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
