import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account, User } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';

@Injectable()
export class AccountService {

  private readonly logger = new Logger('AccountService')

  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(createAccountDto: CreateAccountDto, user: User): Promise<{ data: Account }> {

    try {

      const { name, type, balance } = createAccountDto;

      const newAccount = await this.prisma.account.create({
        data: {
          name,
          type,
          balance,
          userId: user.id
        }
      })

      return { data: newAccount };

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async findAll(user: User): Promise<{ data: Account[] }> {

    try {

      const accounts = await this.prisma.account.findMany({
        where: { userId: user.id }
      });

      return { data: accounts }

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async findOne(id: string, user: User): Promise<{ data: Account }> {

    try {

      const account = await this.prisma.account.findUnique({
        where: { id, userId: user.id }
      })

      if (!account) {
        throw new NotFoundException('Account not found')
      }

      return { data: account };

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async update(id: string, updateAccountDto: UpdateAccountDto, user: User): Promise<{ data: Account }> {

    try {

      const { name, type, balance } = updateAccountDto

      const updateAccount = await this.prisma.account.update({
        where: {
          id: id,
          userId: user.id
        },
        data: {
          name,
          type,
          balance
        }
      })

      return { data: updateAccount }

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async remove(id: string, user: User): Promise<void> {

    try {
      await this.prisma.account.delete({
        where: {
          id,
          userId: user.id
        }
      })

    } catch (error) {
      this.handleErrors(error)
    }
  }

  private handleErrors(error: any): never {

    this.logger.error(error);

    if (error instanceof HttpException) {
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
