import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense, Frequency, User } from '../../generated/prisma';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { addMonths, addWeeks, addYears } from 'date-fns';

@Injectable()
export class ExpenseService {

  private readonly logger = new Logger('ExpenseService');

  constructor(
    private readonly prisma: PrismaService
  ) { }

  /**
   * Creates a user's expense
   * @param createExpenseDto 
   * @param user 
   * @returns { data: Expense }
   */
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
  
  /**
   * Get a specific user's expense
   * @param id 
   * @param user 
   * @returns { data: Expense }
   */
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

  /**
   * Get all user's expenses
   * @param userId 
   * @returns { data: Expense[] }
   */
  async findAll(userId: string) : Promise<{ data: Expense[] }> {

    try {
      
      const expenses = await this.prisma.expense.findMany({
        where: { userId }
      })

      return { data: expenses }

    } catch (error) {
      this.handleErrors(error)
    }
  }

  /**
   * Updates a specific user's expense
   * @param id 
   * @param updateExpenseDto 
   * @param user 
   * @returns { data: Expense }
   */
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

  /**
   * Removes a specific user's expense
   * @param id 
   * @param user 
   * @returns { void }
   */
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
