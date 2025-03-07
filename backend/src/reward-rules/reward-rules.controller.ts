import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { RewardRulesService } from './reward-rules.service';
import { CreateRewardRuleDto } from './dto/create-reward-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/types/role.enum';
import { UpdateRewardRuleDto } from './dto/update-reward-rule.dto';

@Controller('reward-rules')
export class RewardRulesController {
  constructor(private readonly rewardRulesService: RewardRulesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createRewardRuleDto: CreateRewardRuleDto) {
    return this.rewardRulesService.create(createRewardRuleDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.rewardRulesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('credit-card/:id')
  findByCreditCard(@Param('id') id: string) {
    return this.rewardRulesService.findByCreditCard(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rewardRulesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.rewardRulesService.remove(id);
    return { message: 'Reward rule deleted successfully' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRewardRuleDto: UpdateRewardRuleDto) {
    return this.rewardRulesService.update(id, updateRewardRuleDto);
  }
} 