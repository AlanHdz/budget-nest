import { Test, TestingModule } from '@nestjs/testing';
import { DashboardExpensesService } from './dashboard-expenses.service';

describe('DashboardExpensesService', () => {
  let service: DashboardExpensesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardExpensesService],
    }).compile();

    service = module.get<DashboardExpensesService>(DashboardExpensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
