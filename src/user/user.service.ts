import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../../generated/prisma';

@Injectable()
export class UserService {

  private readonly logger = new Logger('UsersService')

  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {

    try {

      const { email, name, username, password } = createUserDto;


      const newUser = await this.prisma.user.create({
        data: {
          name: name,
          email: email,
          username: username,
          password: bcrypt.hashSync(password, 10)
        }
      })

      return newUser;

    } catch (error: any) {
      this.handleErrors(error)
    }

  }

  async findByUsername(username: string): Promise<User | null> {

    try {

      const user = await this.prisma.user.findUnique({ where: { username: username } })

      return user

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async findByEmail(email: string): Promise<User | null> {

    try {

      const user = await this.prisma.user.findUnique({ where: { email: email } })

      return user;

    } catch (error) {
      this.handleErrors(error)
    }

  }


  async findById(id: string): Promise<User | null> {

    try {

      const user = await this.prisma.user.findUnique({ where: { id } })

      return user

    } catch (error) {
      this.handleErrors(error)
    }

  }

  private handleErrors(error: any): never {

    if (error.response) {
      throw error;
    }

    this.logger.error(error);

    if (error instanceof BadRequestException) {
      throw error;
    }

    throw new InternalServerErrorException(error)

  }

}
