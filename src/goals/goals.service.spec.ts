import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from './goals.service';
import { PrismaService } from '../prisma/prisma.service';
import { Goal, GoalType, Prisma } from '../../generated/prisma';
import { Decimal } from '../../generated/prisma/runtime/library';
import { CreateGoalDto } from './dto/create-goal.dto';
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UpdateGoalDto } from './dto/update-goal.dto';

const prismaMock = {
  goal: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}

describe('GoalsService', () => {
  let service: GoalsService;
  let prisma: typeof prismaMock

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
    prisma = module.get(PrismaService)
    jest.clearAllMocks()
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {

    const mockUserId = 'user-id-1';

    const mockGoal: Goal = {
      id: 'goal-id-1',
      amount: Decimal(100),
      month: 1,
      year: 2025,
      type: GoalType.INCOME,
      userId: mockUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }

    const createGoalDto: CreateGoalDto = {
      amount: 100,
      month: 1,
      type: GoalType.INCOME,
      year: 2025
    }

    it('should create a user\'s goals', async () => {
      prisma.goal.findUnique.mockResolvedValue(null)
      prisma.goal.create.mockResolvedValue(mockGoal)

      const result = await service.create(mockUserId, createGoalDto)

      expect(prisma.goal.findUnique).toHaveBeenCalledTimes(1)
      expect(prisma.goal.findUnique).toHaveBeenCalledWith({
        where: {
          userId_type_month_year: {
            userId: mockUserId,
            type: createGoalDto.type,
            month: createGoalDto.month,
            year: createGoalDto.year
          }
        }
      })

      expect(prisma.goal.create).toHaveBeenCalledTimes(1)
      expect(prisma.goal.create).toHaveBeenCalledWith({
        data: {
          ...createGoalDto,
          userId: mockUserId
        }
      })
      expect(result).toEqual({ data: mockGoal })
    })

    it('should launch ConflicException if the user\'s goal already exists', async () => {

      prisma.goal.findUnique.mockResolvedValue(mockGoal)

      expect(service.create(mockUserId, createGoalDto)).rejects.toThrow(
        new ConflictException(`Ya existe una meta de tipo ${mockGoal.type} para ${mockGoal.month}/${mockGoal.year}`)
      )
      expect(prismaMock.goal.findUnique).toHaveBeenCalled()
      expect(prisma.goal.findUnique).toHaveBeenCalledWith({
        where: {
          userId_type_month_year: {
            userId: mockUserId,
            type: createGoalDto.type,
            month: createGoalDto.month,
            year: createGoalDto.year
          }
        }
      })
    })

    it('should call handleErrors if the create function database fails', async () => {
      const dbError = new InternalServerErrorException('Database connection error');

      prisma.goal.findUnique.mockResolvedValue(null);
      prisma.goal.create.mockRejectedValue(dbError);

      const handleErrorsSpy = jest.spyOn(service as any, 'handleErrors').mockImplementation(() => { });

      await service.create(mockUserId, createGoalDto)
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1);
      expect(handleErrorsSpy).toHaveBeenCalledWith(dbError);
    })

  })

  describe('findAll', () => {

    const mockUserId = 'user-id-1'

    const mockGoals: Goal[] = [
      {
        id: 'goal-id-1',
        amount: Decimal(100),
        month: 1,
        year: 2025,
        type: GoalType.INCOME,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      },
      {
        id: 'goal-id-2',
        amount: Decimal(100),
        month: 2,
        year: 2025,
        type: GoalType.INCOME,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      },
    ]

    const mockYear: number = 2025

    it('should find all user\'s goals', async () => {

      prisma.goal.findMany.mockResolvedValue(mockGoals)

      const result = await service.findAll(mockUserId, mockYear)

      expect(prisma.goal.findMany).toHaveBeenCalledTimes(1)
      expect(prisma.goal.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          year: mockYear ? Number(mockYear) : undefined
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }]
      })
      expect(result).toEqual({ data: mockGoals })

    })

    it('should return empty goals array', async () => {

      prisma.goal.findMany.mockResolvedValue([])

      const result = await service.findAll('user-2', mockYear)

      expect(prisma.goal.findMany).toHaveBeenCalledTimes(1)
      expect(prisma.goal.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-2',
          year: mockYear ? Number(mockYear) : undefined
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }]
      })
      expect(result).toEqual({ data: [] })

    })

    it('should call handleErrors if the create function database fails', async () => {
      const dbError = new InternalServerErrorException('Database connection error');

      prisma.goal.findMany.mockRejectedValue(dbError);

      const handleErrorsSpy = jest.spyOn(service as any, 'handleErrors').mockImplementation(() => { });

      await service.findAll(mockUserId, mockYear)
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1);
      expect(handleErrorsSpy).toHaveBeenCalledWith(dbError);
    })

  })

  describe('findOneBy', () => {

    const mockUserId = 'user-id-1'

    const mockGoal: Goal = {
      id: 'goal-id-1',
      amount: Decimal(100),
      month: 1,
      year: 2025,
      userId: mockUserId,
      type: GoalType.INCOME,
      createdAt: new Date,
      updatedAt: new Date,
      deletedAt: null
    }

    it('should return a user\'s goal', async () => {

      prisma.goal.findUnique.mockResolvedValue(mockGoal)

      const result = await service.findOneById(mockGoal.id, mockUserId)

      expect(prisma.goal.findUnique).toHaveBeenCalledTimes(1)
      expect(prisma.goal.findUnique).toHaveBeenCalledWith({
        where: { id: mockGoal.id, userId: mockUserId }
      })
      expect(result).toEqual({ data: mockGoal })
    })

    it('should call NotFoundException if not exists user\'s goal', async () => {

      prisma.goal.findUnique.mockResolvedValue(null)

      expect(service.findOneById(mockGoal.id, mockUserId)).rejects.toThrow(
        new NotFoundException(`Meta con ID ${mockGoal.id} no encontrada`)
      )
      expect(prisma.goal.findUnique).toHaveBeenCalled()

    })

    it('should call handleErrors if database fails', async () => {
      const dbError = new InternalServerErrorException('Database connection error');

      prisma.goal.findUnique.mockRejectedValue(dbError)

      const handleErrorsSpy = jest.spyOn(service as any, 'handleErrors').mockImplementation(() => { });

      await service.findOneById(mockGoal.id, mockUserId)
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1);
      expect(handleErrorsSpy).toHaveBeenCalledWith(dbError);

    })
  })

  describe('findOneByProperties', () => {

    const mockUserId = 'user-id-1'

    const mockGoal: Goal = {
      id: 'mock-id-1',
      amount: Decimal(100),
      month: 1,
      year: 2025,
      type: GoalType.INCOME,
      userId: mockUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }

    it('should return a user\'s goal with properties', async () => {

      prisma.goal.findUnique.mockResolvedValue(mockGoal)

      const result = await service.findOneByProperties(mockUserId, mockGoal.type, mockGoal.month, mockGoal.year)

      expect(prisma.goal.findUnique).toHaveBeenCalledTimes(1)
      expect(prisma.goal.findUnique).toHaveBeenCalledWith({
        where: {
          userId_type_month_year: { userId: mockUserId, type: mockGoal.type, month: mockGoal.month, year: mockGoal.year }
        }
      })
      expect(result).toEqual(mockGoal)

    })

    it('should return NotFoundException if user\'s goal not exists', async () => {

      prisma.goal.findUnique.mockResolvedValue(null)

      expect(service.findOneByProperties(mockUserId, mockGoal.type, mockGoal.month, mockGoal.year)).rejects.toThrow(
        new NotFoundException(`Meta no encontrada`)
      )
      expect(prisma.goal.findUnique).toHaveBeenCalled()

    })

    it('should call handleErrors if database fails', async () => {
      const dbError = new InternalServerErrorException('Database connection error');
      prisma.goal.findUnique.mockRejectedValue(dbError)

      const handleErrorsSpy = jest.spyOn(service as any, 'handleErrors').mockImplementation(() => { });

      await service.findOneByProperties(mockUserId, mockGoal.type, mockGoal.month, mockGoal.year)
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1);
      expect(handleErrorsSpy).toHaveBeenCalledWith(dbError);

    })

  })

  describe('update', () => {

    const mockUserId = 'user-id-1';

    const mockGoal: Goal = {
      id: 'goald-id-1',
      amount: Decimal(100),
      month: 1,
      userId: mockUserId,
      year: 2025,
      type: GoalType.INCOME,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    const updateGoalDto: UpdateGoalDto = {
      amount: 100,
    }

    it('should update and return user\'s goal', async () => {

      prisma.goal.update.mockResolvedValue(mockGoal)

      const result = await service.update(mockGoal.id, mockUserId, updateGoalDto)
      expect(prisma.goal.update).toHaveBeenCalledTimes(1)
      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: mockGoal.id, userId: mockUserId },
        data: {
          amount: updateGoalDto.amount
        }
      })
      expect(result).toEqual({ data: mockGoal })
    })

    it('should call handleErrors if user\'s goals not found', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'An operation failed because it depends on one or more records that were required but not found.',
        { code: 'P2025', clientVersion: 'x.x.x' }
      );

      prisma.goal.update.mockRejectedValue(prismaError)
      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      await service.update(mockGoal.id, mockUserId, updateGoalDto)

      expect(prisma.goal.update).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalledWith(prismaError)
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1)
    })

    it('should call handleErrors if database fails', async () => {
      const prismaError = new InternalServerErrorException('Database connection error');

      prisma.goal.update.mockRejectedValue(prismaError)
      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      await service.update(mockGoal.id, mockUserId, updateGoalDto)

      expect(prisma.goal.update).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalledWith(prismaError)
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1)
    })

  })

  describe('remove', () => {

    const mockGoalId: string = 'goal-id-1'
    const mockUserId: string = 'user-id-1'

    it('should delete a user\'s goal', async () => {

      prisma.goal.delete.mockResolvedValue({})

      await service.remove(mockGoalId, mockUserId)

      expect(prisma.goal.delete).toHaveBeenCalledTimes(1)
      expect(prisma.goal.delete).toHaveBeenCalledWith({
        where: { id: mockGoalId, userId: mockUserId }
      })
    })

    it('should call handleErrors if user\'s goals not found', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'An operation failed because it depends on one or more records that were required but not found.',
        { code: 'P2025', clientVersion: 'x.x.x' }
      );

      prisma.goal.delete.mockRejectedValue(prismaError)
      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      await service.remove(mockGoalId ,mockUserId)

      expect(prisma.goal.delete).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalledWith(prismaError)
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1)
    })

    it('should call handleErrors if database fails', async () => {
      const prismaError = new InternalServerErrorException('Database connection error');

      prisma.goal.delete.mockRejectedValue(prismaError)
      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      await service.remove(mockGoalId, mockUserId)

      expect(prisma.goal.delete).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalledWith(prismaError)
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1)
    })



  })

});
