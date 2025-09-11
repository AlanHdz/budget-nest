import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { AuthService } from "./auth.service";
import { Test, TestingModule } from "@nestjs/testing";
import { JwtStrategy } from "../auth/strategies/jwt.strategy";
import { PrismaService } from "../prisma/prisma.service";
import { LoginUserDto } from "../auth/dto/login-user.dto";
import { User } from "generated/prisma";

import * as bcrypt from 'bcrypt';
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CreateUserDto } from "src/user/dto/create-user.dto";
jest.mock('bcrypt');

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const userServiceMock = {
  findByUsername: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn()
}
const jwtServiceMock = {
  signAsync: jest.fn()
};

const jwtStrategyMock = {
  validate: jest.fn()
}


describe('AuthService', () => {

  let service: AuthService;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: userServiceMock
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock
        },
        {
          provide: JwtStrategy,
          useValue: jwtStrategyMock
        },
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService)
    userService = module.get<UserService>(UserService) as jest.Mocked<UserService>

    jest.clearAllMocks()
  })

  it('should to be defined', () => {
    expect(service).toBeDefined();
  })


  describe('login', () => {

    const loginUserDto: LoginUserDto = {
      email: 'test@example.com',
      password: 'password123'
    }

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

    it('should return a user and token with valid credentials', async () => {

      const mockToken = 'mock-jwt-token';
      userService.findByEmail.mockResolvedValue(mockUser)
      const bcryptSpy = jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);
      const getTokensSpy = jest.spyOn(service, 'getTokens').mockResolvedValue(mockToken);

      const result = await service.login(loginUserDto);

      expect(userServiceMock.findByEmail).toHaveBeenCalledWith(loginUserDto.email);
      expect(bcryptSpy).toHaveBeenCalledWith(loginUserDto.password, mockUser.password);
      expect(getTokensSpy).toHaveBeenCalledWith(mockUser.id);
      expect(result.token).toEqual(mockToken);
      expect(result.email).toEqual(loginUserDto.email);

    })

    it('should launch NotFoundException if the user not exists', async () => {

      userService.findByEmail.mockResolvedValue(null)

      await expect(service.login(loginUserDto)).rejects.toThrow(NotFoundException)
      expect(bcrypt.compareSync).not.toHaveBeenCalled()
    })

    it('should launch BadRequestException if the password is not valid', async () => {

      userService.findByEmail.mockResolvedValue(mockUser);
      const bcryptSpy = jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);

      await expect(service.login(loginUserDto)).rejects.toThrow('Las credenciales no son validas');
      expect(jest.spyOn(service, 'getTokens')).not.toHaveBeenCalled();

    })

  })


  describe('signup', () => {

    const createUserDto: CreateUserDto = {
      name: 'newTest',
      username: 'testuser1',
      email: 'test@test.com',
      password: 'hashedPassword'
    }

    const mockUser: User = {
      id: 'user-id-1',
      name: 'newTest',
      username: 'testuser1',
      email: 'test@test.com',
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }

    it('should create a user and return user with token', async () => {
      
      const mockToken = 'mock-jwt-token';
      userService.findByUsername.mockResolvedValue(null)
      userService.findByEmail.mockResolvedValue(null)
      userService.create.mockResolvedValue(mockUser)
      const getTokensSpy = jest.spyOn(service, 'getTokens').mockResolvedValue(mockToken);

      const result = await service.signUp(createUserDto)

      expect(userServiceMock.findByUsername).toHaveBeenCalledWith(createUserDto.username);
      expect(userServiceMock.findByEmail).toHaveBeenCalledWith(createUserDto.email)
      expect(getTokensSpy).toHaveBeenCalledWith(mockUser.id);
      expect(result.token).toEqual(mockToken);
      expect(result.email).toEqual(createUserDto.email);

    })

    it('should launch BadRequestException if the username exists', async () => {

      userService.findByUsername.mockResolvedValue(mockUser)

      await expect(service.signUp(createUserDto)).rejects.toThrow(BadRequestException);
      expect(jest.spyOn(service, 'getTokens')).not.toHaveBeenCalled();

    })

    it('should launch BadRequestException if the email exists', async () => {

      userService.findByEmail.mockResolvedValue(mockUser)

      await expect(service.signUp(createUserDto)).rejects.toThrow(BadRequestException);
      expect(jest.spyOn(service, 'getTokens')).not.toHaveBeenCalled();

    })


  })

})