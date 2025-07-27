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

    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {

    const mockUser: User = {
      id: 'user-id-1',
      name: 'Test User',
      lastName: 'Test',
      username: 'test',
      email: 'test@example.com',
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date()
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
    }

    it('should create category', async () => {

      prismaMock.category.create.mockResolvedValue(mockCategory)

      const result = await service.create(createCategoryDto, mockUser)

      expect(prismaMock.category.create).toHaveBeenCalledWith({
        data: {
          name: createCategoryDto.name,
          emoji: createCategoryDto.emoji,
          type: createCategoryDto.type,
          userId: mockUser.id
        }
      })
      expect(result).toEqual(mockCategory)
    })

    it('Should call handleErrors and launch a exception if Prisma fails', async () => {

      const mockError = new Error('Error de conexión a la base de datos')

      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      prismaMock.category.create.mockRejectedValue(mockError)

      await expect(service.create(createCategoryDto, mockUser)).rejects.toThrow(InternalServerErrorException)
      expect(loggerSpy).toHaveBeenCalledWith(mockError)
    })

  })

  describe('findAll', () => {

    const mockUser: User = {
      id: 'user-id-1',
      name: 'Test User',
      lastName: 'Test',
      username: 'test',
      email: 'test@example.com',
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should return all categories for userId', async() => {

      const expectedCategories: Category[] = [
        {
          id: 'category-id-1',
          name: 'category',
          type: Type.EXPENSE,
          emoji: '😊😊',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user-id-1'
        },
        {
          id: 'category-id-2',
          name: 'category 2',
          type: Type.EXPENSE,
          emoji: '😊😊',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user-id-1'
        }
      ];

      prismaMock.category.findMany.mockResolvedValue(expectedCategories)

      const result = await service.findAll(mockUser)

      expect(prismaMock.category.findMany).toHaveBeenCalled()
      expect(prismaMock.category.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id
        }
      })
      expect(result).toEqual(expectedCategories)

    })

    it('Should call handleErrors and launch a exception if Prisma fails', async () => {

      const mockError = new Error('Error de conexión a la base de datos')

      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      prismaMock.category.findMany.mockRejectedValue(mockError)

      await expect(service.findAll(mockUser)).rejects.toThrow(InternalServerErrorException)
      expect(loggerSpy).toHaveBeenCalledWith(mockError)

    })

  })

  describe('findOne', () => {

    const mockUser: User = {
      id: 'user-id-1',
      name: 'Test User',
      lastName: 'Test',
      username: 'test',
      email: 'test@example.com',
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should return a category belongs to user', async () => {

      const expectedCategory: Category = {
          id: 'category-id-1',
          name: 'category',
          type: Type.EXPENSE,
          emoji: '😊😊',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user-id-1'
      };

      prismaMock.category.findUnique.mockResolvedValue(expectedCategory)

      const result = await service.findOne(expectedCategory.id, mockUser)

      expect(prismaMock.category.findUnique).toHaveBeenCalled()
      expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
        where: {
          id: expectedCategory.id,
          userId: mockUser.id
        }
      })
      expect(result).toEqual(expectedCategory)

    })

    it('should launch NotFoundException if the category belongs to user not exists', async () => {

      const mockCategoryId = 'category-id-1';

      prismaMock.category.findUnique.mockResolvedValue(null)

      await expect(service.findOne(mockCategoryId, mockUser)).rejects.toThrow(NotFoundException)
      expect(prismaMock.category.findUnique).toHaveBeenCalled()

    })

  })

  describe('update', () => {

    const mockUser: User = {
      id: 'user-id-1',
      name: 'Test User',
      lastName: 'Test',
      username: 'test',
      email: 'test@example.com',
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const categoryMockId = 'category-id-1'

    const updateCategoryDto: UpdateCategoryDto = {
      name: 'category',
      type: Type.EXPENSE,
      emoji: '😊😊',
    }

    it('should update and return a category succesfully', async () => {

      const expectedUpdateCategory: Category = {
        id: categoryMockId,
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'category',
        type: Type.EXPENSE,
        emoji: '😊😊',
      }

      prismaMock.category.update.mockResolvedValue(expectedUpdateCategory)
      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      const result = await service.update(categoryMockId, updateCategoryDto, mockUser)

      expect(prismaMock.category.update).toHaveBeenCalledWith({
        data: {
          name: updateCategoryDto.name,
          emoji: updateCategoryDto.emoji,
          type: updateCategoryDto.type
        },
        where: {
          id: categoryMockId,
          userId: mockUser.id
        }
      })
      expect(result).toEqual(expectedUpdateCategory)
      expect(loggerSpy).not.toHaveBeenCalled()
    })

    it('should launch NotFoundException if the category not exists', async () => {

      const categoryMockId = 'category-id-1'

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'An operation failed because it depends on one or more records that were required but not found.',
        { code: 'P2025', clientVersion: 'x.x.x' }
      );

      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      prismaMock.category.update.mockRejectedValue(prismaError)
      
      await expect(service.update(categoryMockId, updateCategoryDto, mockUser)).rejects.toThrow(NotFoundException);
      await expect(service.update(categoryMockId, updateCategoryDto, mockUser))
        .rejects.toThrow('The category does not exist or does not belong to you');

      expect(loggerSpy).toHaveBeenCalledWith(prismaError)

    })

    it('should throw InternalServerErrorException for other database errors', async () => {

      const genericError = new Error('Some unexpected database error');

      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})
      
      prismaMock.category.update.mockRejectedValue(genericError);

      
      await expect(service.update(categoryMockId, updateCategoryDto, mockUser))
        .rejects.toThrow(InternalServerErrorException);
      
      expect(loggerSpy).toHaveBeenCalledWith(genericError);
    });
    
  })

  describe('remove', () => {

     const mockUser: User = {
      id: 'user-id-1',
      name: 'Test User',
      lastName: 'Test',
      username: 'test',
      email: 'test@example.com',
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const categoryId = 'category-id-1'


    it('should delete a category succesfully and return a response', async() => {

      const expectedResponse = { message: 'Category deleted succesfully.', status: HttpStatus.OK };
      prismaMock.category.delete.mockResolvedValue({ message: 'Category deleted succesfully.', status: HttpStatus.OK });

      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      const result = await service.remove(categoryId, mockUser)

      expect(prismaMock.category.delete).toHaveBeenCalledWith({
        where: {
          id: categoryId,
          userId: mockUser.id
        }
      })
      expect(result).toEqual(expectedResponse)
      expect(loggerSpy).not.toHaveBeenCalled()

    })

    it('should launch NotFoundException if the category not exists', async () => {

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'An operation failed because it depends on one or more records that were required but not found.',
        { code: 'P2025', clientVersion: 'x.x.x' }
      );

      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      prismaMock.category.delete.mockRejectedValue(prismaError)
      
      await expect(service.remove(categoryId, mockUser)).rejects.toThrow(NotFoundException);
      await expect(service.remove(categoryId, mockUser))
        .rejects.toThrow('The category does not exist or does not belong to you');

      expect(loggerSpy).toHaveBeenCalledWith(prismaError)

    })

    it('should throw InternalServerErrorException for other database errors', async () => {

      const genericError = new Error('Some unexpected database error');

      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})
      
      prismaMock.category.delete.mockRejectedValue(genericError);

      
      await expect(service.remove(categoryId, mockUser))
        .rejects.toThrow(InternalServerErrorException);
      
      expect(loggerSpy).toHaveBeenCalledWith(genericError);
    });


  })

});
