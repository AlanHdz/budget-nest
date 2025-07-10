import { IsPositive, Max, Min } from "class-validator";


export class LimitLatestMovementsDto {

  @IsPositive()
  @Min(1)
  @Max(20)
  limit: number;

}