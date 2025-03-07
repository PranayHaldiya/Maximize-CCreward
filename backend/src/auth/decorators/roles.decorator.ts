import { SetMetadata } from '@nestjs/common';
import { Role } from '../types/role.enum';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
//export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
export const ROLES_KEY = 'roles';
