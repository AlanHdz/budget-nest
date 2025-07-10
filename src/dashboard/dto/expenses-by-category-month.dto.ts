import { IsNotEmpty, Max, Min } from "class-validator";


export class ExpensesByCategoryMonthDto {

  @IsNotEmpty()
  @Min(0)
  @Max(11)
  month: number

}