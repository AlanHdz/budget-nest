import { Body, Controller, HttpStatus, UseGuards, HttpCode } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { JwtGuard } from '../auth/guards/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../../generated/prisma';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Controller('budgets')
export class BudgetController {

  constructor(
    private readonly budgetService: BudgetService
  ) {}
  

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@GetUser() user: User, @Body() createBudgetDto: CreateBudgetDto) {
    return await this.budgetService.create(user.id, createBudgetDto)
  }

}
