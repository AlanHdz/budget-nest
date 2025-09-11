import { Test, TestingModule } from '@nestjs/testing';
import { RecurringIncomeService } from './recurring-income.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';

const prismaMock = {
  income: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}

describe('RecurringIncomeService', () => {
  let service: RecurringIncomeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringIncomeService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ],
      imports: [PrismaModule]
    }).compile();

    service = module.get<RecurringIncomeService>(RecurringIncomeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
