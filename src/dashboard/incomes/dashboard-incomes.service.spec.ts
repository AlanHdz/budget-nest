import { Test, TestingModule } from '@nestjs/testing';
import { DashboardIncomesService } from '../dashboard-incomes.service';

describe('DashboardIncomesService', () => {
  let service: DashboardIncomesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardIncomesService],
    }).compile();

    service = module.get<DashboardIncomesService>(DashboardIncomesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
