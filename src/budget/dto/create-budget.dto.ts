import { IsInt, IsNotEmpty, IsNumber, IsUUID, Max, Min } from "class-validator";


export class CreateBudgetDto {

  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  amount: number;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsInt()
  @Min(1)
  @Max(12)
  @IsNotEmpty()
  month: number;

  @IsInt()
  @Min(2022)
  @IsNotEmpty()
  year: number;

}