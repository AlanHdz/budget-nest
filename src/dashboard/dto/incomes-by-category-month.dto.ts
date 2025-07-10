import { IsNotEmpty, Max, Min } from "class-validator";


export class IncomesByCategoryMonthDto {

  @IsNotEmpty()
  @Min(0)
  @Max(11)
  month: number

}