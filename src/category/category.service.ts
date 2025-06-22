import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Category, User } from 'generated/prisma';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

@Injectable()
export class CategoryService {

  private readonly logger = new Logger('CategoryService')

  constructor(
    private readonly prisma: PrismaService
  ) {}

  async create(createCategoryDto: CreateCategoryDto, user: User) : Promise<Category> {
    try {
      
      const { name, type, emoji } = createCategoryDto;

      const newCategory = await this.prisma.category.create({
        data: {
          name,
          type,
          emoji,
          userId: user.id
        }
      })

      return newCategory;

    } catch (error) {
      this.handleErrors(error)
    }
  }

  async findAll(user: User) : Promise<Category[]> {
    
    try {
      
      const categories = await this.prisma.category.findMany({
        where: {
          userId: user.id
        }
      })

      return categories;

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async findOne(id: string, user: User) : Promise<Category> {
    
    try {
      
      const category = await this.prisma.category.findUnique({
        where: {
          id: id,
          userId: user.id
        }
      })

       if (!category) {
        throw new NotFoundException('Category not found')
      }

      return category;

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, user: User) : Promise<Category> {
    
    try {

      const { name, type, emoji } = updateCategoryDto
      
      const updatedCategory = await this.prisma.category.update({
        data: {
          name,
          type,
          emoji
        },
        where: {
          id,
          userId: user.id
        }
      })

      return updatedCategory;

    } catch (error) {
      this.handleErrors(error)
    }

  }

  async remove(id: string, user: User) {
    
    try {
      
      await this.prisma.category.delete({
        where: {
          id,
          userId: user.id
        }
      })

      return { message: 'Category deleted succesfully.', status: HttpStatus.OK }

    } catch (error) {
      this.handleErrors(error)
    }

  }

  private handleErrors(error: any) : never {
    
    if (error.response) {
      throw new InternalServerErrorException(error.response)
    }
    
    this.logger.error(error);

    if (error instanceof BadRequestException) {
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
