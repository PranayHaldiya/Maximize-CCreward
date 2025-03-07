import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CreditCardsModule } from './credit-cards/credit-cards.module';
import { BanksModule } from './banks/banks.module';
import { TransactionsModule } from './transactions/transactions.module';
import { RewardsModule } from './rewards/rewards.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { RewardRulesModule } from './reward-rules/reward-rules.module';
import { TransactionCategoriesModule } from './transaction-categories/transaction-categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule, 
    UsersModule, 
    CreditCardsModule, 
    BanksModule, 
    TransactionsModule, 
    RewardsModule, 
    PrismaModule,
    RewardRulesModule,
    TransactionCategoriesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
