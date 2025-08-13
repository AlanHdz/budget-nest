import { Test, TestingModule } from '@nestjs/testing';
import { RecurringIncomeController } from './recurring-income.controller';
import { RecurringIncomeService } from './recurring-income.service';

describe('RecurringIncomeController', () => {
  let controller: RecurringIncomeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringIncomeController],
      providers: [RecurringIncomeService],
    }).compile();

    controller = module.get<RecurringIncomeController>(RecurringIncomeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
