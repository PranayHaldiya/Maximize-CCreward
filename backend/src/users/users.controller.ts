import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from './../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/role.enum';
import { AddCreditCardDto } from './dto/add-credit-card.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Credit card endpoints
  @UseGuards(JwtAuthGuard)
  @Get(':id/credit-cards')
  getUserCreditCards(@Param('id') id: string) {
    return this.usersService.getUserCreditCards(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/credit-cards')
  addCreditCard(
    @Param('id') id: string,
    @Body() addCreditCardDto: AddCreditCardDto,
  ) {
    return this.usersService.addCreditCard(id, addCreditCardDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/rewards/summary')
  getRewardSummary(@Param('id') id: string) {
    return this.usersService.getRewardSummary(id);
  }
} 