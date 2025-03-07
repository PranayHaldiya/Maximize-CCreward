import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { TransactionCategoriesService } from './transaction-categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/role.enum';

@Controller('transaction-categories')
export class TransactionCategoriesController {
  constructor(private readonly transactionCategoriesService: TransactionCategoriesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.transactionCategoriesService.createCategory(createCategoryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAllCategories() {
    return this.transactionCategoriesService.findAllCategories();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOneCategory(@Param('id') id: string) {
    return this.transactionCategoriesService.findOneCategory(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  removeCategory(@Param('id') id: string) {
    return this.transactionCategoriesService.removeCategory(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':categoryId/sub-categories')
  createSubCategory(
    @Param('categoryId') categoryId: string,
    @Body() createSubCategoryDto: CreateSubCategoryDto,
  ) {
    return this.transactionCategoriesService.createSubCategory(categoryId, createSubCategoryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':categoryId/sub-categories')
  findAllSubCategories(@Param('categoryId') categoryId: string) {
    return this.transactionCategoriesService.findAllSubCategories(categoryId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('sub-categories/:id')
  removeSubCategory(@Param('id') id: string) {
    return this.transactionCategoriesService.removeSubCategory(id);
  }
} 