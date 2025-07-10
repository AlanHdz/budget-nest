


export class MovementDto {

  id: number;

  amount: number;

  description: string;

  createdAt: Date;

  type: 'income' | 'expense';

}