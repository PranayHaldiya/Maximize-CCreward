import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankDto } from './dto/create-bank.dto';

@Injectable()
export class BanksService {
  constructor(private prisma: PrismaService) {}

  async create(createBankDto: CreateBankDto) {
    // Check if bank with name already exists
    const existingBank = await this.prisma.bank.findUnique({
      where: { name: createBankDto.name },
    });

    if (existingBank) {
      throw new ConflictException('Bank with this name already exists');
    }

    // Create the bank
    return this.prisma.bank.create({
      data: createBankDto,
    });
  }

  async findAll() {
    return this.prisma.bank.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }
} 