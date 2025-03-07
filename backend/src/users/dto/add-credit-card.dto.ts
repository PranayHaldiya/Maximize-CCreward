import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddCreditCardDto {
  @IsNotEmpty()
  @IsString()
  creditCardId: string;
  
  @IsOptional()
  @IsString()
  cardNumber?: string;
  
  @IsOptional()
  @IsString()
  expiryDate?: string;
} 
