import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseService } from './expense.service';
import { PrismaService } from '../prisma/prisma.service';
import { Account, Expense, Frequency, RecurringExpense, TypeAccount, User } from '../../generated/prisma';
import { Decimal } from '../../generated/prisma/runtime/library';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UpdateExpenseDto } from './dto/update-expense.dto';

const mockPrismaTx = {
  account: {
    update: jest.fn(),
    findUnique: jest.fn()
  },
  recurringExpense: {
    create: jest.fn(),
    delete: jest.fn()
  },
  expense: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
}

const mockPrisma = {
  expense: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  recurringExpense: {
    create: jest.fn()
  },
  account: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  $transaction: jest.fn().mockImplementation(async (callback) => {
    return await callback(mockPrismaTx)
  })
}

describe('ExpenseService', () => {
  let service: ExpenseService;
  let prisma: typeof mockPrisma;

  const mockUser: User = {
    id: 'user-id-1',
    name: 'Test User',
    username: 'test',
    email: 'test@example.com',
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null
  }

  const mockAccount: Account = {
    id: 'account-id-1',
    userId: mockUser.id,
    name: 'BBVA',
    type: TypeAccount.DEBIT,
    balance: Decimal(1500),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null
  }


  const mockExpense: Expense = {
    id: 'expense-id-1',
    title: 'Groceries',
    description: 'description',
    amount: Decimal(100),
    categoryId: 'category-id-1',
    accountId: mockAccount.id,
    createdAt: new Date(),
    deletedAt: null,
    updatedAt: new Date(),
    dateExpense: new Date(),
    recurringExpenseId: null,
    userId: mockUser.id
  }

  const mockExpenseRecurring: Expense = {
    id: 'expense-id-1',
    title: 'Groceries',
    description: 'description',
    amount: Decimal(100),
    categoryId: 'category-id-1',
    accountId: mockAccount.id,
    createdAt: new Date(),
    deletedAt: null,
    updatedAt: new Date(),
    dateExpense: new Date(),
    recurringExpenseId: 'new-rec-exp-1',
    userId: mockUser.id
  }


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        {
          provide: PrismaService,
          useValue: mockPrisma
        }
      ],
    }).compile();

    service = module.get<ExpenseService>(ExpenseService);
    prisma = module.get(PrismaService)
    jest.clearAllMocks()
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {

    it('should create a simple, non-recurring expense succesfully', async () => {
      const createExpenseDto: CreateExpenseDto = {
        accountId: mockAccount.id,
        categoryId: 'category-id-1',
        amount: 100,
        dateExpense: new Date().toISOString(),
        title: 'expense',
        description: 'expense',
        isRecurring: false
      }

      prisma.account.findUnique.mockResolvedValue(mockAccount)
      mockPrismaTx.expense.create.mockResolvedValue(mockExpense)

      const result = await service.create(createExpenseDto, mockUser)

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: createExpenseDto.accountId, userId: mockUser.id },
      });
      expect(prisma.$transaction).toHaveBeenCalled()

      expect(mockPrismaTx.account.update).toHaveBeenCalledWith({
        where: { id: mockAccount.id },
        data: { balance: { decrement: createExpenseDto.amount } }
      })

      expect(mockPrismaTx.expense.create).toHaveBeenCalled()
      expect(mockPrismaTx.recurringExpense.create).not.toHaveBeenCalled()

      expect(result).toEqual({ data: mockExpense })

    })

    it('should create a recurring expense sucessfully', async () => {
      const createExpenseDto: CreateExpenseDto = {
        accountId: mockAccount.id,
        categoryId: 'category-id-1',
        amount: 100,
        dateExpense: new Date().toISOString(),
        title: 'expense',
        description: 'expense',
        isRecurring: true,
        frequency: Frequency.MONTHLY
      }

      const mockRecurringExpense: RecurringExpense = {
        accountId: mockExpense.id,
        amount: Decimal(mockExpense.amount),
        id: 'recurring-expense-1-id',
        title: mockExpense.title,
        frequency: Frequency.MONTHLY,
        startDate: new Date(),
        userId: mockUser.id,
        categoryId: 'category-id-1',
        nextDueDate: new Date(),
        createdAt: new Date(),
        deletedAt: new Date(),
        updatedAt: new Date(),
      }

      const { recurringExpenseId, ...mockDataExpense } = mockExpense

      const mockExpenseWithRecurring: Expense = { ...mockDataExpense, recurringExpenseId: mockRecurringExpense.id }

      const calculateDueDateSpy = jest.spyOn(service as any, '_calculateNextDueDate')
        .mockReturnValue(new Date('2025-10-09'))

      prisma.account.findUnique.mockResolvedValue(mockAccount)
      mockPrismaTx.recurringExpense.create.mockResolvedValue(mockRecurringExpense)
      mockPrismaTx.expense.create.mockResolvedValue(mockExpenseWithRecurring)

      //Act
      const result = await service.create(createExpenseDto, mockUser)

      //Assert
      expect(prisma.$transaction).toHaveBeenCalled()
      expect(calculateDueDateSpy).toHaveBeenCalled()
      expect(mockPrismaTx.account.update).toHaveBeenCalled()
      expect(mockPrismaTx.recurringExpense.create).toHaveBeenCalled()
      expect(mockPrismaTx.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recurringExpenseId: mockRecurringExpense.id
          })
        })
      )
      expect(result).toEqual({ data: mockExpenseWithRecurring })
    })

    it('should throw NotFoundException if the account does not exist', async () => {
      prisma.account.findUnique.mockResolvedValue(null);
      const createDto: CreateExpenseDto = {
        accountId: mockAccount.id,
        categoryId: 'category-id-1',
        amount: 100,
        dateExpense: new Date().toISOString(),
        title: 'expense',
        description: 'expense',
        isRecurring: true,
        frequency: Frequency.MONTHLY
      }
      await expect(service.create(createDto, mockUser)).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException if account balance is insufficient', async () => {

      const createDto: CreateExpenseDto = {
        accountId: mockAccount.id,
        categoryId: 'category-id-1',
        amount: 2000,
        dateExpense: new Date().toISOString(),
        title: 'expense',
        description: 'expense',
        isRecurring: true,
        frequency: Frequency.MONTHLY
      }

      prisma.account.findUnique.mockResolvedValue(mockAccount)
      await expect(service.create(createDto, mockUser)).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException if expense is recurring but frequency is missing', async () => {
      const createDto: CreateExpenseDto = {
        accountId: mockAccount.id,
        categoryId: 'category-id-1',
        amount: 100,
        dateExpense: new Date().toISOString(),
        title: 'expense',
        description: 'expense',
        isRecurring: true,
      }
      prisma.account.findUnique.mockResolvedValue(mockAccount)

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        new BadRequestException('La frecuencia es requerida para gastos recurrentes')
      )

      expect(prisma.$transaction).not.toHaveBeenCalled()

    })

    it('should call handleErrors and return a error if prisma fails', async () => {
      const createDto: CreateExpenseDto = {
        accountId: mockAccount.id,
        categoryId: 'category-id-1',
        amount: 100,
        dateExpense: new Date().toISOString(),
        title: 'expense',
        description: 'expense',
        isRecurring: true,
      }
      const mockError = new InternalServerErrorException('Database connection error')
      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      prisma.account.findUnique.mockRejectedValue(mockError)

      await service.create(createDto, mockUser)

      expect(prisma.account.findUnique).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalled()
      expect(handleErrorsSpy).toHaveBeenCalledWith(mockError)
    })

  })

  describe('update', () => {

    it('should convert a simple expense to a recurring one', async () => {

      const updateDto: UpdateExpenseDto = {
        isRecurring: true,
        frequency: Frequency.MONTHLY,
        amount: 75,
        accountId: 'category-id-1'
      };

      const mockNewRecurringInfo = { id: 'new-rec-exp-1' }

      prisma.expense.findUnique.mockResolvedValue(mockExpense)
      mockPrismaTx.account.findUnique.mockResolvedValue(mockAccount)
      mockPrismaTx.recurringExpense.create.mockResolvedValue(mockNewRecurringInfo)

      const calculateDueDateSpy = jest.spyOn(service as any, '_calculateNextDueDate').mockReturnValue(new Date())

      await service.update(mockExpense.id, updateDto, mockUser)

      expect(mockPrismaTx.account.update).toHaveBeenCalledWith({
        where: { id: mockExpense.accountId },
        data: { balance: { increment: mockExpense.amount } }
      })

      expect(mockPrismaTx.account.update).toHaveBeenCalledWith({
        where: { id: updateDto.accountId },
        data: { balance: { decrement: updateDto.amount } }
      })

      expect(calculateDueDateSpy).toHaveBeenCalled();
      expect(mockPrismaTx.recurringExpense.create).toHaveBeenCalled();
      expect(mockPrismaTx.expense.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          recurringExpenseId: mockNewRecurringInfo.id
        })
      }));
    })

    it('should convert a recurring expense to a simple one', async () => {

      const updateDto: UpdateExpenseDto = {
        isRecurring: false
      }
      prisma.expense.findUnique.mockResolvedValue(mockExpenseRecurring)
      mockPrismaTx.account.findUnique.mockResolvedValue(mockAccount)

      await service.update(mockExpenseRecurring.id, updateDto, mockUser)

      expect(mockPrismaTx.recurringExpense.delete).toHaveBeenCalledWith({
        where: { id: mockExpenseRecurring.recurringExpenseId }
      })

      expect(mockPrismaTx.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recurringExpenseId: null
          })
        })
      )

      expect(mockPrismaTx.recurringExpense.create).not.toHaveBeenCalled()

    })

    it('should update the amount of a simple expense without changing its recurrence', async () => {

      const updateDto: UpdateExpenseDto = { amount: 60, accountId: 'account-id-1' }

      prisma.expense.findUnique.mockResolvedValue(mockExpense)
      mockPrismaTx.account.findUnique.mockResolvedValue(mockAccount)

      const result = await service.update(mockExpense.id, updateDto, mockUser)

      expect(mockPrismaTx.account.update).toHaveBeenCalledWith({
        where: { id: mockExpense.accountId },
        data: { balance: { increment: mockExpense.amount } }
      })

      expect(mockPrismaTx.account.update).toHaveBeenCalledWith({
        where: { id: updateDto.accountId },
        data: { balance: { decrement: updateDto.amount } }
      })

      expect(mockPrismaTx.recurringExpense.create).not.toHaveBeenCalled()
      expect(mockPrismaTx.recurringExpense.delete).not.toHaveBeenCalled()

      expect(mockPrismaTx.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockExpense.id },
          data: updateDto,
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
      )
    })

    it('should throw NotFoundException if the initial expense is not found', async () => {

      prisma.expense.findUnique.mockResolvedValue(null)

      await expect(service.update('fake-id', {}, mockUser)).rejects.toThrow(NotFoundException)
      expect(prisma.$transaction).not.toHaveBeenCalled()

    })

    it('should throw BadRequestException when making an expense recurring without frequency', async () => {

      const updateDto: UpdateExpenseDto = { isRecurring: true, frequency: undefined }
      prisma.expense.findUnique.mockResolvedValue(mockExpense)

      await expect(service.update(mockExpense.id, updateDto, mockUser)).rejects.toThrow(BadRequestException)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException on insufficiente balance in the target account (inside transaction)', async () => {
      const updateDto: UpdateExpenseDto = { amount: 999 }

      const accountWithLowBalance = { ...mockAccount, balance: new Decimal(500) }

      prisma.expense.findUnique.mockResolvedValue(mockExpense)
      mockPrismaTx.account.findUnique.mockResolvedValue(accountWithLowBalance)

      await expect(service.update(mockExpense.id, updateDto, mockUser)).rejects.toThrow(BadRequestException)
      expect(prisma.$transaction).toHaveBeenCalled()
      expect(mockPrismaTx.expense.update).not.toHaveBeenCalled()

    })

    it('shoudl call handleError and throw InternalServerErrorException if prisma fails', async () => {

      const updateDto: UpdateExpenseDto = { amount: 100 }

      const mockError = new InternalServerErrorException('Database connection error')
      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      prisma.expense.findUnique.mockRejectedValue(mockError)

      await service.update(mockExpense.id, updateDto, mockUser)

      expect(prisma.expense.findUnique).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalled()
      expect(handleErrorsSpy).toHaveBeenCalledWith(mockError)

    })

  })

  describe('findOne', () => {

    it('should return a expense belonging to the user', async () => {

      const mockExpenseCategoryAccount = {
        ...mockExpense,
        cattegory: {
          id: 'category-id-1',
          name: 'category'
        },
        account: {
          id: mockAccount.id,
          name: mockAccount.name,
          type: mockAccount.type
        }
      }

      prisma.expense.findUnique.mockResolvedValue(mockExpenseCategoryAccount)

      const result = await service.findOne(mockExpense.id, mockUser)

      expect(prisma.expense.findUnique).toHaveBeenCalledWith({
        where: { id: mockExpense.id, userId: mockUser.id },
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

      expect(result).toEqual({ data: mockExpenseCategoryAccount })

    })

    it('should throw NotFoundException if the expense is not found', async () => {

      prisma.expense.findUnique.mockResolvedValue(null)

      await expect(service.findOne('fake-id', mockUser)).rejects.toThrow(NotFoundException)
    })

    it('shoudl call handleErrors and throw InternalServerErrorException if the prisma fails', async () => {
      const mockError = new InternalServerErrorException('Database connection error')
      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      prisma.expense.findUnique.mockRejectedValue(mockError)

      await service.findOne(mockExpense.id, mockUser)

      expect(prisma.expense.findUnique).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalled()
      expect(handleErrorsSpy).toHaveBeenCalledWith(mockError)
    })

  })

  describe('findAll', () => {

    it('should return an expenses array belonging to the user', async () => {

      const mockArrayExpenses: Expense[] = [
        {
          ...mockExpense
        },
        {
          ...mockExpenseRecurring
        }
      ]

      prisma.expense.findMany.mockResolvedValue(mockArrayExpenses)

      const result = await service.findAll(mockUser.id)

      expect(prisma.expense.findMany).toHaveBeenCalled()
      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id }
      })

      expect(result).toEqual({ data: mockArrayExpenses })

    })

    it('should return an empty expenses array belonging to the user', async () => {

      prisma.expense.findMany.mockResolvedValue([])

      const result = await service.findAll(mockUser.id)

      expect(prisma.expense.findMany).toHaveBeenCalled()
      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id }
      })
      expect(result).toEqual({ data: [] })
    })

    it('should call handleErrors and throw InternalServerErrorException if prisma fails', async () => {
      const mockError = new InternalServerErrorException('Database connection error')
      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      prisma.expense.findMany.mockRejectedValue(mockError)

      await service.findAll(mockUser.id)

      expect(prisma.expense.findMany).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalled()
      expect(handleErrorsSpy).toHaveBeenCalledWith(mockError)
    })

  })

  describe('remove', () => {

    it('should delete a non-recurring expense belonging to the user', async () => {

      prisma.expense.findUnique.mockResolvedValue(mockExpense)

      await service.remove(mockExpense.id, mockUser)

      expect(prisma.expense.findUnique).toHaveBeenCalled()
      expect(mockPrismaTx.account.update).toHaveBeenCalled()
      expect(mockPrismaTx.recurringExpense.delete).not.toHaveBeenCalled()
      expect(mockPrismaTx.expense.delete).toHaveBeenCalled()

      expect(prisma.expense.findUnique).toHaveBeenCalledWith({
        where: { id: mockExpense.id, userId: mockUser.id }
      })

      expect(mockPrismaTx.account.update).toHaveBeenCalledWith({
        where: { id: mockExpense.accountId },
        data: {
          balance: {
            increment: mockExpense.amount
          }
        }
      })
      expect(mockPrismaTx.expense.delete).toHaveBeenCalledWith({
        where: { id: mockExpense.id, userId: mockUser.id }
      })

    })

    it('should delete a recurring expense belonging to the user', async () => {

      const mockExpenseWithRecurring = {
        ...mockExpense,
        recurringExpenseId: 'recurring-exp-id-1'
      }

      prisma.expense.findUnique.mockResolvedValue(mockExpenseWithRecurring)

      await service.remove(mockExpenseWithRecurring.id, mockUser)

      expect(prisma.expense.findUnique).toHaveBeenCalledWith({
        where: { id: mockExpense.id, userId: mockUser.id }
      })

      expect(mockPrismaTx.account.update).toHaveBeenCalledWith({
        where: { id: mockExpense.accountId },
        data: {
          balance: {
            increment: mockExpense.amount
          }
        }
      })

      expect(mockPrismaTx.recurringExpense.delete).toHaveBeenCalledWith({
        where: { id: mockExpenseWithRecurring.recurringExpenseId }
      })

      expect(mockPrismaTx.expense.delete).toHaveBeenCalledWith({
        where: { id: mockExpenseWithRecurring.id, userId: mockExpenseWithRecurring.userId }
      })
    })

    it('should throw NotFounException if the expense is not found', async () => {
      prisma.expense.findUnique.mockResolvedValue(null)

      await expect(service.remove(mockExpense.id, mockUser)).rejects.toThrow(NotFoundException)
    })

    it('shoudl call handleErrors and throw InternalServerErrorException if the prisma fails', async () => {
      const mockError = new InternalServerErrorException('Database connection error')
      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      prisma.expense.findUnique.mockRejectedValue(mockError)

      await service.remove(mockExpense.id, mockUser)

      expect(prisma.expense.findUnique).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalled()
      expect(handleErrorsSpy).toHaveBeenCalledWith(mockError)
    })


  })

});
