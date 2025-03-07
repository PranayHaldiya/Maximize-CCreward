import { Role } from '../../auth/types/role.enum';
import { Exclude } from 'class-transformer';

export class User {
  id: string;
  email: string;
  
  @Exclude()
  password: string;
  
  firstName: string | null;
  lastName: string | null;
  role?: Role;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
    // Convert string role to enum if needed
    if (partial.role !== undefined) {
      if (typeof partial.role === 'string') {
        this.role = partial.role === 'USER' ? Role.USER : Role.ADMIN;
      } else {
        this.role = partial.role;
      }
    }
  }
} 