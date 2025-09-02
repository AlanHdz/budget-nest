import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { Account, Category, Prisma, TypeAccount, User } from '../../generated/prisma';
import { Decimal } from '../../generated/prisma/runtime/library';
import { HttpStatus, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UpdateAccountDto } from './dto/update-account.dto';


const prismaMock = {
  account: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}

describe('AccountService', () => {
  let service: AccountService;
  let prisma: typeof prismaMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    prisma = module.get(PrismaService)

    jest.clearAllMocks();
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

    const createAccountDto: CreateAccountDto = {
      name: 'BBVA',
      type: TypeAccount.DEBIT,
      balance: 1500
    }

    it('should create and return an account succesfully', async () => {

      const expectedAccount: Account = {
        id: 'account-id-1',
        userId: mockUser.id,
        name: 'BBVA',
        type: TypeAccount.DEBIT,
        balance: Decimal(1500),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      prisma.account.create.mockResolvedValue(expectedAccount)
      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      const result = await service.create(createAccountDto, mockUser)

      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          name: createAccountDto.name,
          balance: createAccountDto.balance,
          type: createAccountDto.type,
          userId: mockUser.id
        }
      })
      expect(prisma.account.create).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expectedAccount)
      expect(loggerSpy).not.toHaveBeenCalled()
    })

    it('should call handleErrors and return a error if prisma fails', async () => {

      const mockError = new Error('Error de conexión a la base de datos')

      prisma.account.create.mockRejectedValue(mockError)
      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      await expect(service.create(createAccountDto, mockUser)).rejects.toThrow(InternalServerErrorException)
      expect(loggerSpy).toHaveBeenCalled()

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

    const accounts: Account[] = [
      {
        id: 'account-id-1',
        name: 'account',
        balance: Decimal(1500),
        type: TypeAccount.DEBIT,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUser.id
      }
    ]

    it('should return an array of contains categories belongs to user', async () => {
      

      prisma.account.findMany.mockResolvedValue(accounts)

      const result = await service.findAll(mockUser)

      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      expect(prisma.account.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id
        }
      })
      expect(prisma.account.findMany).toHaveBeenCalledTimes(1)
      expect(result).toEqual(accounts)
      expect(loggerSpy).not.toHaveBeenCalled()
    })

    it('should call handleErrors and return a error if prisma fails', async () => {

      prisma.account.findMany.mockRejectedValue(new Error('Error de conexión a la base de datos'))
      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      await expect(service.findAll(mockUser)).rejects.toThrow(InternalServerErrorException);
      expect(loggerSpy).toHaveBeenCalled();
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

    const accountId = 'account-id-1';

    it('should find and return an account belongs to user', async () => {
      const expectedAccount: Account = {
        id: 'account-id-1',
        userId: mockUser.id,
        name: 'BBVA',
        type: TypeAccount.DEBIT,
        balance: Decimal(1500),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      prisma.account.findUnique.mockResolvedValue(expectedAccount)
      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      const result = await service.findOne(accountId, mockUser)

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: {
          id: accountId,
          userId: mockUser.id
        }
      });
      expect(prisma.account.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedAccount);
      expect(loggerSpy).not.toHaveBeenCalled();
    })

    it('should throw an NotFounException if account is not found', async () => {

      prisma.account.findUnique.mockResolvedValue(null)
      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {});

      await expect(service.findOne(accountId, mockUser)).rejects.toThrow('Account not found');

      expect(prisma.account.findUnique).toHaveBeenCalledWith({
        where: { id: accountId, userId: mockUser.id }
      })
      expect(loggerSpy).not.toHaveBeenCalled()
    })

    it('should throw an InternalServerError if database fails', async () => {

      const mockError = new Error('Error de conexión a la base de datos')

      prisma.account.findUnique.mockRejectedValue(mockError)
      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      await expect(service.findOne(accountId, mockUser)).rejects.toThrow(InternalServerErrorException)
      expect(loggerSpy).toHaveBeenCalled()
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
    };

    const accountId = 'account-id-1';

    const updateAccountDto: UpdateAccountDto = {
      name: 'BBVA',
      type: TypeAccount.DEBIT,
      balance: 1500
    }

    it('should update and return an account successfully', async () => {
      const expectedAccount: Account = {
        id: accountId,
        userId: mockUser.id,
        name: 'BBVA',
        type: TypeAccount.DEBIT,
        balance: Decimal(1500),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      prisma.account.update.mockResolvedValue(expectedAccount)
      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      const result = await service.update(accountId, updateAccountDto, mockUser)

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: {
          id: accountId,
          userId: mockUser.id
        },
        data: {
          name: updateAccountDto.name,
          type: updateAccountDto.type,
          balance: updateAccountDto.balance
        }
      });
      expect(prisma.account.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedAccount);
      expect(loggerSpy).not.toHaveBeenCalled();
    })

    it('should throw a NotFoundException if the account not exists', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
              'An operation failed because it depends on one or more records that were required but not found.',
              { code: 'P2025', clientVersion: 'x.x.x' }
            );
      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})
      
      prisma.account.update.mockRejectedValue(prismaError)
      
      await expect(service.update(accountId, updateAccountDto, mockUser)).rejects.toThrow(new NotFoundException("The account does not exist or does not belong to you"));
      expect(loggerSpy).toHaveBeenCalled()

    })

    it('shoudl throw a InternalServerError if the database fails', async () => {

      const genericError = new Error('Some unexpected database error');

      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      prisma.account.update.mockRejectedValue(genericError)

      await expect(service.update(accountId, updateAccountDto, mockUser)).rejects.toThrow(InternalServerErrorException);
      expect(loggerSpy).toHaveBeenCalled()

    })

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
    };

    const accountId = 'account-id-1';

    it('should delete account belongs to user successfully and return a response', async () => {

      const expectedMessage = { message: 'Account deleted succesfully.', status: HttpStatus.OK }

      prisma.account.delete.mockResolvedValue({ message: 'Account deleted succesfully.', status: HttpStatus.OK })
      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      const result = await service.remove(accountId, mockUser)

      expect(prisma.account.delete).toHaveBeenCalledWith({
        where: {
          id: accountId,
          userId: mockUser.id
        }
      });
      expect(prisma.account.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedMessage)
      expect(loggerSpy).not.toHaveBeenCalled()
    })

    it('should throw a NotFoundException if the account not exists', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
              'An operation failed because it depends on one or more records that were required but not found.',
              { code: 'P2025', clientVersion: 'x.x.x' }
            );
      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})
      
      prisma.account.delete.mockRejectedValue(prismaError)
      
      await expect(service.remove(accountId, mockUser)).rejects.toThrow(new NotFoundException("The account does not exist or does not belong to you"));
      expect(loggerSpy).toHaveBeenCalled()

    })

    it('shoudl throw a InternalServerError if the database fails', async () => {

      const genericError = new Error('Some unexpected database error');

      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      prisma.account.delete.mockRejectedValue(genericError)

      await expect(service.remove(accountId, mockUser)).rejects.toThrow(InternalServerErrorException);
      expect(loggerSpy).toHaveBeenCalled()

    })

  })

});
