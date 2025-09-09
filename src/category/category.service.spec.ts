import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from '../category/dto/create-category.dto';
import { Category, Prisma, Type, User } from '../../generated/prisma';
import { PrismaService } from '../../src/prisma/prisma.service';
import { HttpStatus, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UpdateCategoryDto } from './dto/update-category.dto';

const prismaMock = {
  category: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}

describe('CategoryService', () => {
  let service: CategoryService;
  let prisma: typeof prismaMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ],
    }).compile();
    prisma = module.get(PrismaService)
    service = module.get<CategoryService>(CategoryService);
    jest.clearAllMocks()
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {

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

    const mockCategory = {
      id: 'category-id-1',
      name: 'category',
      type: Type.EXPENSE,
      emoji: '😊😊',
      userId: 'user-id-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const createCategoryDto: CreateCategoryDto = {
      name: 'category',
      type: Type.EXPENSE,
      emoji: '😊😊',
      color: '#FFF'
    }

    it('should create category', async () => {

      prisma.category.create.mockResolvedValue(mockCategory)

      const result = await service.create(createCategoryDto, mockUser)

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: createCategoryDto.name,
          emoji: createCategoryDto.emoji,
          type: createCategoryDto.type,
          userId: mockUser.id,
          color: createCategoryDto.color
        }
      })
      expect(result).toEqual({ data: mockCategory })
    })

    it('Should call handleErrors and launch a exception if Database fails', async () => {

      const mockError = new InternalServerErrorException('Database connection error')

      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      prisma.category.create.mockRejectedValue(mockError)

      await service.create(createCategoryDto, mockUser)

      expect(prisma.category.create).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1);
      expect(handleErrorsSpy).toHaveBeenCalledWith(mockError)
    })

  })

  describe('findAll', () => {

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

    it('should return all categories for userId', async () => {

      const expectedCategories: Category[] = [
        {
          id: 'category-id-1',
          name: 'category',
          type: Type.EXPENSE,
          emoji: '😊😊',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user-id-1',
          deletedAt: null,
          color: '#FFF'
        },
        {
          id: 'category-id-2',
          name: 'category 2',
          type: Type.EXPENSE,
          emoji: '😊😊',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user-id-1',
          deletedAt: null,
          color: '#000'
        }
      ];

      prisma.category.findMany.mockResolvedValue(expectedCategories)

      const result = await service.findAll(mockUser)

      expect(prisma.category.findMany).toHaveBeenCalled()
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id
        }
      })
      expect(result).toEqual({ data: expectedCategories })

    })

    it('Should call handleErrors and launch a exception if Prisma fails', async () => {

      const mockError = new InternalServerErrorException('Database connection error')

      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      prisma.category.findMany.mockRejectedValue(mockError)

      await service.findAll(mockUser)
      expect(prisma.category.findMany).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalledWith(mockError)
    })

  })

  describe('findOne', () => {

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

    it('should return a category belongs to user', async () => {

      const expectedCategory: Category = {
        id: 'category-id-1',
        name: 'category',
        type: Type.EXPENSE,
        emoji: '😊😊',
        color: '#FFF',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-id-1',
        deletedAt: null,
      };

      prisma.category.findUnique.mockResolvedValue(expectedCategory)

      const result = await service.findOne(expectedCategory.id, mockUser)

      expect(prisma.category.findUnique).toHaveBeenCalled()
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: {
          id: expectedCategory.id,
          userId: mockUser.id
        }
      })
      expect(result).toEqual({ data: expectedCategory })

    })

    it('should launch NotFoundException if the category belongs to user not exists', async () => {

      const mockCategoryId = 'category-id-1';

      prismaMock.category.findUnique.mockResolvedValue(null)

      await expect(service.findOne(mockCategoryId, mockUser)).rejects.toThrow(NotFoundException)
      expect(prismaMock.category.findUnique).toHaveBeenCalled()
    })

    it('should call handleError when prisma throws an unexecpeted error', async () => {

      const mockCategoryId = 'category-id-1';
      const dbError = new InternalServerErrorException('Database connection error');

      prisma.category.findUnique.mockRejectedValue(dbError);

      const handleErrorsSpy = jest.spyOn(service as any, 'handleErrors').mockImplementation(() => { });

      await service.findOne(mockCategoryId, mockUser)
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1);
      expect(handleErrorsSpy).toHaveBeenCalledWith(dbError);

    })

  })

  describe('update', () => {

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

    const categoryMockId = 'category-id-1'

    const updateCategoryDto: UpdateCategoryDto = {
      name: 'category',
      type: Type.EXPENSE,
      emoji: '😊😊',
      color: '#FFF',
    }

    it('should update and return a category succesfully', async () => {

      const expectedUpdateCategory: Category = {
        id: categoryMockId,
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'category',
        color: '#FFF',
        type: Type.EXPENSE,
        emoji: '😊😊',
        deletedAt: null
      }

      prisma.category.update.mockResolvedValue(expectedUpdateCategory)
      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => { })

      const result = await service.update(categoryMockId, updateCategoryDto, mockUser)

      expect(prisma.category.update).toHaveBeenCalledWith({
        data: {
          name: updateCategoryDto.name,
          emoji: updateCategoryDto.emoji,
          type: updateCategoryDto.type,
          color: updateCategoryDto.color
        },
        where: {
          id: categoryMockId,
          userId: mockUser.id
        }
      })
      expect(result).toEqual({ data: expectedUpdateCategory })
      expect(loggerSpy).not.toHaveBeenCalled()
    })

    it('should launch NotFoundException if the category not exists', async () => {

      const categoryMockId = 'category-id-1'

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'An operation failed because it depends on one or more records that were required but not found.',
        { code: 'P2025', clientVersion: 'x.x.x' }
      );

      prisma.category.update.mockRejectedValue(prismaError)

      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      await service.update(categoryMockId, updateCategoryDto, mockUser)

      expect(prisma.category.update).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalledWith(prismaError)
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1)
    })

    it('should throw InternalServerErrorException for other database errors', async () => {

      const genericError = new InternalServerErrorException('Database connection error');

      prisma.category.update.mockRejectedValue(genericError);

      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      await service.update(categoryMockId, updateCategoryDto, mockUser)

      expect(prisma.category.update).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1)
      expect(handleErrorsSpy).toHaveBeenCalledWith(genericError);
    });

  })

  describe('remove', () => {

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

    const categoryId = 'category-id-1'


    it('should delete a category succesfully', async () => {
      prisma.category.delete.mockResolvedValue({})

      await service.remove(categoryId, mockUser)

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: {
          id: categoryId,
          userId: mockUser.id
        }
      })
      expect(prisma.category.delete).toHaveBeenCalledTimes(1)
    })

    it('should throw NotFoundException if the category not exists', async () => {

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'An operation failed because it depends on one or more records that were required but not found.',
        { code: 'P2025', clientVersion: 'x.x.x' }
      );

      prisma.category.delete.mockRejectedValue(prismaError)

      const handleErrorsSpy = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      await service.remove(categoryId, mockUser)
      expect(prisma.category.delete).toHaveBeenCalledTimes(1);
      expect(handleErrorsSpy).toHaveBeenCalledTimes(1);
      expect(handleErrorsSpy).toHaveBeenCalledWith(prismaError);

    })

    it('should throw InternalServerErrorException for other database errors', async () => {

      const genericError = new InternalServerErrorException('Database connection error');

      const handleErrors = jest.spyOn((service as any), 'handleErrors').mockImplementation(() => { })

      prisma.category.delete.mockRejectedValue(genericError)

      await service.remove(categoryId, mockUser)

      expect(prisma.category.delete).toHaveBeenCalledTimes(1)
      expect(handleErrors).toHaveBeenCalledTimes(1)
      expect(handleErrors).toHaveBeenCalledWith(genericError)

    });


  })

});
