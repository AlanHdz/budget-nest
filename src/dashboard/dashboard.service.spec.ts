import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GoalsModule } from '../goals/goals.module';

const prismaMock = {
  income: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: typeof prismaMock

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ],
      imports: [PrismaModule]
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get(PrismaService)
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
