import { Module } from '@nestjs/common';

import { RewardRulesService } from './reward-rules.service';
import { RewardRulesController } from './reward-rules.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RewardRulesController],
  providers: [RewardRulesService],
  exports: [RewardRulesService],
})
export class RewardRulesModule {} 