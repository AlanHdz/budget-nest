import { BadRequestException, ConflictException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Goal, GoalType } from '../../generated/prisma';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {

  private readonly logger = new Logger('GoalsService')

  constructor(
    private readonly prisma: PrismaService
  ) { }

  /**
   * Crea una nueva meta para un usuario
   * @param userId 
   * @param createGoalDto 
   * @returns {Promise<Goal>}
   */
  async create(userId: string, createGoalDto: CreateGoalDto) : Promise<Goal> {

    try {

      const { type, month, year } = createGoalDto

      const existingGoal = await this.prisma.goal.findUnique({
        where: {
          userId_type_month_year: { userId, type, month, year }
        }
      })

      if (existingGoal) {
        throw new ConflictException(`Ya existe una meta de tipo ${type} para ${month}/${year}`)
      }

      return this.prisma.goal.create({
        data: {
          ...createGoalDto,
          userId
        }
      })

    } catch (error) {
      this.handleErrors(error)
    }

  }

  /**
   * Obtiene todas las metas del usuario ordenadas por años y meses
   * @param userId 
   * @param year 
   * @returns {Promise<Goal[]>}
   */
  async findAll(userId: string, year?: number) : Promise<Goal[]> {

    try {
      
      return this.prisma.goal.findMany({
        where: {
          userId,
          year: year ? Number(year) : undefined
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }]
      })

    } catch (error) {
      this.handleErrors(error)
    }

  }

  /**
   * Obtiene una meta del usuario por ID 
   * @param id 
   * @param userId 
   * @returns {Promise<goal>}
   */
  async findOneById(id: string, userId: string) : Promise<Goal> {

    try {
      
      const goal = await this.prisma.goal.findUnique({
        where: { id, userId }
      })

      if (!goal) {
        throw new NotFoundException(`Meta con ID ${id} no encontrada`)
      }

      return goal;

    } catch (error) {
      this.handleErrors(error)
    }

  }

  /**
   * Encuentra una meta especifica por sus propiedades unicas (mes, año, tipo)
   * @param userId 
   * @param type 
   * @param month 
   * @param year 
   * @returns {Promise<Goal>}
   */
  async findOneByProperties(userId: string, type: GoalType, month: number, year: number) : Promise<Goal> {

    try {
      
      const goal = await this.prisma.goal.findUnique({
        where: {
          userId_type_month_year: { userId, type, month, year }
        }
      })

      if (!goal) {
        throw new NotFoundException(`Meta de tipo ${type} para ${month}/${year} no encontrada`)
      }
      
      return goal;

    } catch (error) {
      this.handleErrors(error)
    }

  }

  /**
   * Actualiza el monto de una meta existente de un usuario
   * @param id 
   * @param userId 
   * @param updateGoalDto 
   * @returns {Promise<Goal>}
   */
  async update(id: string, userId: string, updateGoalDto: UpdateGoalDto) : Promise<Goal> {
    await this.findOneById(id, userId);

    return this.prisma.goal.update({
      where: { id },
      data: {
        amount: updateGoalDto.amount,
      },
    });
  }

  /**
   * Elimina una meta de un usuario
   * @param id 
   * @param userId 
   * @returns {Promise<{ message: string, status: number }>}
   */
  async remove(id: string, userId: string) : Promise<{ message: string; status: number }> {
    
    await this.findOneById(id, userId);
    
    await this.prisma.goal.delete({
      where: { id },
    });

    return { message: `Meta con ID "${id}" eliminada exitosamente.`, status: HttpStatus.OK };
  }

  private handleErrors(error: any): never {

    if (error.response) {
      throw error
    }
    console.log("dsadsadsada");
    
    this.logger.error(error);

    if (error instanceof BadRequestException) {
      throw error;
    }

    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('The category does not exist or does not belong to you');
    }

    throw new InternalServerErrorException(error)
  }

}
