import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum RewardType {
  CASHBACK = 'CASHBACK',
  POINTS = 'POINTS',
  MILES = 'MILES'
}

export enum TransactionType {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BOTH = 'BOTH'
}

export class CreateRewardRuleDto {
  @IsNotEmpty()
  @IsUUID()
  creditCardId: string;

  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsUUID()
  subCategoryId?: string;

  @IsEnum(TransactionType)
  @IsOptional()
  transactionType?: TransactionType;

  @IsNotEmpty()
  @IsEnum(RewardType)
  rewardType: RewardType;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  rewardValue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyCap?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumSpend?: number;
} 