import { IsNumber, IsPositive } from 'class-validator';

export class UpdateGoalDto {
  @IsNumber()
  @IsPositive()
  amount: number;
}