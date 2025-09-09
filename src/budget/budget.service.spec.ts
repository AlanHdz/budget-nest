import { Test, TestingModule } from '@nestjs/testing';
import { BudgetService } from './budget.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { Budget, Category } from '../../generated/prisma';
import { Decimal } from '../../generated/prisma/runtime/library';
import { InternalServerErrorException } from '@nestjs/common';

const prismaMock = {
  budget: {
    upsert: jest.fn()
  },
  category: {
    findFirst: jest.fn()
  }
}

describe('BudgetService', () => {
  let service: BudgetService;
  let prisma: typeof prismaMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ],
    }).compile();
    prisma = module.get(PrismaService)
    service = module.get<BudgetService>(BudgetService);
    jest.clearAllMocks()
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {

    const createBudgetDto: CreateBudgetDto = {
      amount: 100,
      categoryId: 'category-id-1',
      month: 1,
      year: 2025
    }

    const mockBudget: Budget = {
      amount: Decimal(100),
      categoryId: 'category-id-1',
      id: 'budget-id-1',
      month: 1,
      year: 2025,
      userId: 'user-id-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }

    const mockCategory: Category = {
      color: '#FFF',
      emoji: '😂',
      id: 'category-id-1',
      name: 'category',
      type: 'INCOME',
      userId: 'user-id-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }

    const mockUserId = 'user-id-1'

    it('should create or update a budget', async () => {

      prisma.category.findFirst.mockResolvedValue(mockCategory)
      prisma.budget.upsert.mockResolvedValue(mockBudget)

      const result = await service.create(mockUserId, createBudgetDto)

      expect(prisma.category.findFirst).toHaveBeenCalledTimes(1)
      expect(prisma.category.findFirst).toHaveBeenCalledWith({
        where: { id: mockCategory.id, userId: mockUserId }
      })
      expect(prisma.budget.upsert).toHaveBeenCalledTimes(1)
      expect(prisma.budget.upsert).toHaveBeenCalledWith({
        where: {
          userId_categoryId_month_year: {
            userId: mockUserId,
            categoryId: mockCategory.id,
            month: mockBudget.month,
            year: mockBudget.year
          }
        },
        update: {
          amount: mockBudget.amount.toNumber()
        },
        create: {
          userId: mockUserId,
          categoryId: mockCategory.id,
          amount: mockBudget.amount.toNumber(),
          month: mockBudget.month,
          year: mockBudget.year
        }
      })
      expect(result).toEqual({ data: mockBudget })
    })

    it('should call handleErrors if database fails', async () => {

      const mockError = new InternalServerErrorException('Database connection error')

      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      prisma.budget.upsert.mockRejectedValue(mockError)

      await service.create(mockUserId, createBudgetDto)

      expect(prisma.budget.upsert).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1);
      expect(handleErrorsSpy).toHaveBeenCalledWith(mockError)

    })

  })

});
