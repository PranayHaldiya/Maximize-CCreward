import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';

@Injectable()
export class CreditCardsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.creditCard.findMany({
      include: {
        bank: true,
        rewardRules: {
          include: {
            category: true,
            subCategory: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const creditCard = await this.prisma.creditCard.findUnique({
      where: { id },
      include: {
        bank: true,
        rewardRules: {
          include: {
            category: true,
            subCategory: true,
          },
        },
      },
    });

    if (!creditCard) {
      throw new NotFoundException(`Credit card with ID ${id} not found`);
    }

    return creditCard;
  }

  async create(createCreditCardDto: CreateCreditCardDto) {
    // Check if bank exists
    const bank = await this.prisma.bank.findUnique({
      where: { id: createCreditCardDto.bankId },
    });

    if (!bank) {
      throw new NotFoundException(`Bank with ID ${createCreditCardDto.bankId} not found`);
    }

    // Check if credit card with same name and bank already exists
    const existingCard = await this.prisma.creditCard.findFirst({
      where: {
        name: createCreditCardDto.name,
        bankId: createCreditCardDto.bankId,
      },
    });

    if (existingCard) {
      throw new ConflictException('Credit card with this name already exists for this bank');
    }

    // Create the credit card
    return this.prisma.creditCard.create({
      data: createCreditCardDto,
      include: {
        bank: true,
      },
    });
  }
} 