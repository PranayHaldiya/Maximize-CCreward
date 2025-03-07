import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { AddCreditCardDto } from './dto/add-credit-card.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    // Convert Prisma user to our User entity
    const userEntity = new User({
      ...user,
      role: undefined // Clear the role first
    });
    userEntity.role = user.role as any; // Assign the role directly

    return userEntity;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users.map(user => {
      const userEntity = new User({
        ...user,
        role: undefined // Clear the role first
      });
      userEntity.role = user.role as any; // Assign the role directly
      return userEntity;
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const userEntity = new User({
      ...user,
      role: undefined // Clear the role first
    });
    userEntity.role = user.role as any; // Assign the role directly

    return userEntity;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const userEntity = new User({
      ...user,
      role: undefined // Clear the role first
    });
    userEntity.role = user.role as any; // Assign the role directly

    return userEntity;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Check if user exists
    await this.findOne(id);

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    const userEntity = new User({
      ...updatedUser,
      role: undefined // Clear the role first
    });
    userEntity.role = updatedUser.role as any; // Assign the role directly

    return userEntity;
  }

  async remove(id: string): Promise<void> {
    // Check if user exists
    await this.findOne(id);

    // Delete user
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async getUserCreditCards(userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get user's credit cards with all related data
    const userCreditCards = await this.prisma.userCreditCard.findMany({
      where: { userId },
      include: {
        creditCard: {
          include: {
            bank: true,
            rewardRules: {
              include: {
                category: true,
                subCategory: true,
              },
            },
          },
        },
      },
    });

    // Transform the data to a more usable format
    return userCreditCards.map(userCard => ({
      id: userCard.id,
      creditCardId: userCard.creditCardId,
      userId: userCard.userId,
      cardNumber: userCard.cardNumber,
      expiryDate: userCard.expiryDate,
      creditCard: {
        id: userCard.creditCard.id,
        name: userCard.creditCard.name,
        bankId: userCard.creditCard.bankId,
        annualFee: userCard.creditCard.annualFee,
        image: userCard.creditCard.image,
        bank: userCard.creditCard.bank,
        rewardRules: userCard.creditCard.rewardRules,
      },
    }));
  }

  async addCreditCard(userId: string, addCreditCardDto: AddCreditCardDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if credit card exists
    const creditCard = await this.prisma.creditCard.findUnique({
      where: { id: addCreditCardDto.creditCardId },
    });

    if (!creditCard) {
      throw new NotFoundException(`Credit card with ID ${addCreditCardDto.creditCardId} not found`);
    }

    // Check if user already has this credit card
    const existingUserCard = await this.prisma.userCreditCard.findUnique({
      where: {
        userId_creditCardId: {
          userId,
          creditCardId: addCreditCardDto.creditCardId,
        },
      },
    });

    if (existingUserCard) {
      throw new ConflictException('User already has this credit card');
    }

    // Add credit card to user
    const userCreditCard = await this.prisma.userCreditCard.create({
      data: {
        userId,
        creditCardId: addCreditCardDto.creditCardId,
        cardNumber: addCreditCardDto.cardNumber,
        expiryDate: addCreditCardDto.expiryDate ? new Date(addCreditCardDto.expiryDate) : null,
      },
      include: {
        creditCard: {
          include: {
            bank: true,
          },
        },
      },
    });

    // Return the added credit card
    return {
      id: userCreditCard.creditCard.id,
      name: userCreditCard.creditCard.name,
      bank: userCreditCard.creditCard.bank,
      cardNumber: userCreditCard.cardNumber,
      expiryDate: userCreditCard.expiryDate ? userCreditCard.expiryDate.toISOString().split('T')[0] : null,
    };
  }

  async getRewardSummary(userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // For now, return dummy data since we don't have actual reward tracking yet
    // In a real implementation, you would query the database for actual reward data
    return {
      totalRewardsValue: 0,
      thisMonthRewards: 0,
      rewardCategories: 0,
    };
  }
} 