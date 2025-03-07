import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRewardRuleDto } from './dto/create-reward-rule.dto';
import { UpdateRewardRuleDto } from './dto/update-reward-rule.dto';

@Injectable()
export class RewardRulesService {
  constructor(private prisma: PrismaService) {}

  async create(createRewardRuleDto: CreateRewardRuleDto) {
    // Check if credit card exists
    const creditCard = await this.prisma.creditCard.findUnique({
      where: { id: createRewardRuleDto.creditCardId },
    });

    if (!creditCard) {
      throw new NotFoundException(`Credit card with ID ${createRewardRuleDto.creditCardId} not found`);
    }

    // Check if category exists
    const category = await this.prisma.transactionCategory.findUnique({
      where: { id: createRewardRuleDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${createRewardRuleDto.categoryId} not found`);
    }

    // Check if subcategory exists if provided
    if (createRewardRuleDto.subCategoryId) {
      const subCategory = await this.prisma.transactionSubCategory.findUnique({
        where: { id: createRewardRuleDto.subCategoryId },
      });

      if (!subCategory) {
        throw new NotFoundException(`Sub-category with ID ${createRewardRuleDto.subCategoryId} not found`);
      }

      // Check if subcategory belongs to the specified category
      if (subCategory.categoryId !== createRewardRuleDto.categoryId) {
        throw new NotFoundException(`Sub-category does not belong to the specified category`);
      }
    }

    // Create reward rule
    return this.prisma.rewardRule.create({
      data: {
        creditCardId: createRewardRuleDto.creditCardId,
        categoryId: createRewardRuleDto.categoryId,
        subCategoryId: createRewardRuleDto.subCategoryId,
        transactionType: createRewardRuleDto.transactionType || 'BOTH',
        rewardType: createRewardRuleDto.rewardType,
        rewardValue: createRewardRuleDto.rewardValue,
        monthlyCap: createRewardRuleDto.monthlyCap,
        minimumSpend: createRewardRuleDto.minimumSpend,
      },
      include: {
        creditCard: {
          include: {
            bank: true,
          },
        },
        category: true,
        subCategory: true,
      },
    });
  }

  async findAll() {
    return this.prisma.rewardRule.findMany({
      include: {
        creditCard: {
          include: {
            bank: true,
          },
        },
        category: true,
        subCategory: true,
      },
    });
  }

  async findByCreditCard(creditCardId: string) {
    // Check if credit card exists
    const creditCard = await this.prisma.creditCard.findUnique({
      where: { id: creditCardId },
    });

    if (!creditCard) {
      throw new NotFoundException(`Credit card with ID ${creditCardId} not found`);
    }

    return this.prisma.rewardRule.findMany({
      where: { creditCardId },
      include: {
        creditCard: {
          include: {
            bank: true,
          },
        },
        category: true,
        subCategory: true,
      },
    });
  }

  async findOne(id: string) {
    const rewardRule = await this.prisma.rewardRule.findUnique({
      where: { id },
      include: {
        creditCard: {
          include: {
            bank: true,
          },
        },
        category: true,
        subCategory: true,
      },
    });

    if (!rewardRule) {
      throw new NotFoundException(`Reward rule with ID ${id} not found`);
    }

    return rewardRule;
  }

  async remove(id: string) {
    // Check if reward rule exists
    const rewardRule = await this.prisma.rewardRule.findUnique({
      where: { id },
    });

    if (!rewardRule) {
      throw new NotFoundException(`Reward rule with ID ${id} not found`);
    }

    // Delete reward rule
    await this.prisma.rewardRule.delete({
      where: { id },
    });
    
    return { success: true };
  }

  async update(id: string, updateRewardRuleDto: UpdateRewardRuleDto) {
    // Check if reward rule exists
    const existingRule = await this.prisma.rewardRule.findUnique({
      where: { id },
    });

    if (!existingRule) {
      throw new NotFoundException(`Reward rule with ID ${id} not found`);
    }

    // Check if credit card exists if provided
    if (updateRewardRuleDto.creditCardId) {
      const creditCard = await this.prisma.creditCard.findUnique({
        where: { id: updateRewardRuleDto.creditCardId },
      });

      if (!creditCard) {
        throw new NotFoundException(`Credit card with ID ${updateRewardRuleDto.creditCardId} not found`);
      }
    }

    // Check if category exists if provided
    if (updateRewardRuleDto.categoryId) {
      const category = await this.prisma.transactionCategory.findUnique({
        where: { id: updateRewardRuleDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${updateRewardRuleDto.categoryId} not found`);
      }
    }

    // Check if subcategory exists if provided
    if (updateRewardRuleDto.subCategoryId) {
      const subCategory = await this.prisma.transactionSubCategory.findUnique({
        where: { id: updateRewardRuleDto.subCategoryId },
      });

      if (!subCategory) {
        throw new NotFoundException(`Sub-category with ID ${updateRewardRuleDto.subCategoryId} not found`);
      }

      // Check if subcategory belongs to the specified category
      const categoryId = updateRewardRuleDto.categoryId || existingRule.categoryId;
      if (subCategory.categoryId !== categoryId) {
        throw new NotFoundException(`Sub-category does not belong to the specified category`);
      }
    }

    // Update reward rule
    return this.prisma.rewardRule.update({
      where: { id },
      data: {
        creditCardId: updateRewardRuleDto.creditCardId,
        categoryId: updateRewardRuleDto.categoryId,
        subCategoryId: updateRewardRuleDto.subCategoryId,
        transactionType: updateRewardRuleDto.transactionType,
        rewardType: updateRewardRuleDto.rewardType,
        rewardValue: updateRewardRuleDto.rewardValue,
        monthlyCap: updateRewardRuleDto.monthlyCap,
        minimumSpend: updateRewardRuleDto.minimumSpend,
      },
      include: {
        creditCard: {
          include: {
            bank: true,
          },
        },
        category: true,
        subCategory: true,
      },
    });
  }
} 