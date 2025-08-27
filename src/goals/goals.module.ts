import { Module } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
  imports: [PrismaModule]
})
export class GoalsModule {}
