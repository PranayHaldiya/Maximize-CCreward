import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';

@Injectable()
export class TransactionCategoriesService {
  constructor(private prisma: PrismaService) {}

  async createCategory(createCategoryDto: CreateCategoryDto) {
    // Check if category with name already exists
    const existingCategory = await this.prisma.transactionCategory.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException(`Category with name '${createCategoryDto.name}' already exists`);
    }

    // Create category
    return this.prisma.transactionCategory.create({
      data: {
        name: createCategoryDto.name,
      },
    });
  }

  async findAllCategories() {
    return this.prisma.transactionCategory.findMany({
      include: {
        subCategories: true,
      },
    });
  }

  async findOneCategory(id: string) {
    const category = await this.prisma.transactionCategory.findUnique({
      where: { id },
      include: {
        subCategories: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async removeCategory(id: string) {
    // Check if category exists
    const category = await this.prisma.transactionCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Delete category (will cascade delete subcategories)
    await this.prisma.transactionCategory.delete({
      where: { id },
    });
  }

  async createSubCategory(categoryId: string, createSubCategoryDto: CreateSubCategoryDto) {
    // Check if category exists
    const category = await this.prisma.transactionCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // Check if subcategory with name already exists in this category
    const existingSubCategory = await this.prisma.transactionSubCategory.findFirst({
      where: {
        categoryId,
        name: createSubCategoryDto.name,
      },
    });

    if (existingSubCategory) {
      throw new ConflictException(
        `Sub-category with name '${createSubCategoryDto.name}' already exists in this category`,
      );
    }

    // Create subcategory
    return this.prisma.transactionSubCategory.create({
      data: {
        name: createSubCategoryDto.name,
        categoryId,
      },
    });
  }

  async findAllSubCategories(categoryId: string) {
    // Check if category exists
    const category = await this.prisma.transactionCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return this.prisma.transactionSubCategory.findMany({
      where: { categoryId },
    });
  }

  async removeSubCategory(id: string) {
    // Check if subcategory exists
    const subCategory = await this.prisma.transactionSubCategory.findUnique({
      where: { id },
    });

    if (!subCategory) {
      throw new NotFoundException(`Sub-category with ID ${id} not found`);
    }

    // Delete subcategory
    await this.prisma.transactionSubCategory.delete({
      where: { id },
    });
  }
}