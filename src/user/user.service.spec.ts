import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { User } from 'generated/prisma';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

jest.mock('bcrypt')


const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const loggerMock = {
  error: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;
  let prisma: typeof prismaMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: Logger,
          useValue: loggerMock,
        }
      ]
    }).compile();

    service = module.get<UserService>(UserService)
    prisma = module.get(PrismaService)

    jest.clearAllMocks()

  })

  it('should to be defined', () => {
    expect(service).toBeDefined();
  })

  describe('findById', () => {
    it('should return a user if found it', async () => {
      const mockUser: User = {
        id: '304923094093',
        email: 'example@example.com',
        name: 'Example',
        lastName: 'Example last name',
        username: 'example',
        password: 'alan1234',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('304923094093');

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '304923094093' },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return null if the user no exists', async () => {
      const userId = 'no-existent-id';

      prisma.user.findUnique.mockResolvedValue(null)

      const result = await service.findById(userId)

      expect(result).toBeNull()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    })

    it('should call handleErrors and launch a exception if Prisma fail', async () => {

      const userId = 'error-id';
      const mockError = new Error('Error de conexión a la base de datos')

      const loggerSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => {});

      prisma.user.findUnique.mockRejectedValue(mockError)

      await expect(service.findById(userId)).rejects.toThrow(InternalServerErrorException)
      expect(loggerSpy).toHaveBeenCalledWith(mockError)
    })

  })

  describe('findByUsername', () => {

    it('Should return a user if found it', async () => {

      const mockUser: User = {

        id: '304923094093',
        email: 'example@example.com',
        name: 'Example',
        lastName: 'Example last name',
        username: 'example',
        password: 'alan1234',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.findByUsername('example')

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'example' },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);

    })

    it('should return null if the user no exists', async () => {

      const username = 'no-existent-id';

      prisma.user.findUnique.mockResolvedValue(null)

      const result = await service.findByUsername(username)

      expect(result).toBeNull()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: username } })

    })

    it('should call handleErrors and launch a exception if Prisma fail', async () => {

      const userId = 'error-id';
      const mockError = new Error('Error de conexión a la base de datos')

      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      prisma.user.findUnique.mockRejectedValue(mockError)

      await expect(service.findByUsername(userId)).rejects.toThrow(InternalServerErrorException)
      expect(loggerSpy).toHaveBeenCalledWith(mockError)
    })

  })

  describe('findByEmail', () => {

    it('Should return a user if found it', async () => {

      const mockUser: User = {

        id: '304923094093',
        email: 'example@example.com',
        name: 'Example',
        lastName: 'Example last name',
        username: 'example',
        password: 'alan1234',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.findByEmail('example@example.com')

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'example@example.com' },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);

    })

    it('should return null if the user no exists', async () => {

      const email = 'no-existent-email';

      prisma.user.findUnique.mockResolvedValue(null)

      const result = await service.findByEmail(email)

      expect(result).toBeNull()
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: email } })

    })

    it('should call handleErrors and launch a exception if Prisma fail', async () => {

      const email = 'error-id';
      const mockError = new Error('Error de conexión a la base de datos')

      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      prisma.user.findUnique.mockRejectedValue(mockError)

      await expect(service.findByEmail(email)).rejects.toThrow(InternalServerErrorException)
      expect(loggerSpy).toHaveBeenCalledWith(mockError)
    })

  })

  describe('create', () => {

    it('should hash the password and create a new user', async () => {

      const createUserDto: CreateUserDto = {
        email: 'example@example.com',
        name: 'Test',
        lastName: 'User',
        username: 'testuser',
        password: 'example1234',
      }

      const hashedPassword = 'hashedPassword';
      const expectedUser: User = { id: 'user-id-1', ...createUserDto, createdAt: new Date(), updatedAt: new Date() };

      (bcrypt.hashSync as jest.Mock).mockReturnValue(hashedPassword);
      prisma.user.create.mockResolvedValue(expectedUser)

      const result = await service.create(createUserDto)

      expect(bcrypt.hashSync).toHaveBeenCalledWith(createUserDto.password, 10)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          lastName: createUserDto.lastName,
          username: createUserDto.username,
          password: hashedPassword
        }
      })
      expect(result).toEqual(expectedUser)

    })

    it('should call handleErrors and launch a exception if Prisma fail', async () => {

      const email = 'error-id';
      const mockError = new Error('Error de conexión a la base de datos')

      const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {})

      prisma.user.findUnique.mockRejectedValue(mockError)

      await expect(service.findByEmail(email)).rejects.toThrow(InternalServerErrorException)
      expect(loggerSpy).toHaveBeenCalledWith(mockError)
    })


  })

})