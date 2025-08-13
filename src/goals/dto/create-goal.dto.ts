import { IsEnum, IsInt, IsNumber, IsPositive, Max, Min } from "class-validator";
import { GoalType } from "../../../generated/prisma";


export class CreateGoalDto {

  @IsEnum(GoalType)
  type: GoalType = GoalType.INCOME

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number

  @IsInt()
  @Min(new Date().getFullYear())
  year: number;

}