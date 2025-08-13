import { Test, TestingModule } from '@nestjs/testing';
import { RecurringIncomeService } from './recurring-income.service';

describe('RecurringIncomeService', () => {
  let service: RecurringIncomeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurringIncomeService],
    }).compile();

    service = module.get<RecurringIncomeService>(RecurringIncomeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
