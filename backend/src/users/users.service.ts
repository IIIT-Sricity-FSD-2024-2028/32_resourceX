import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { CreateEmployeeDto, CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly dataService: DataService) {}

  getMockUser(role: string, orgId?: string): Partial<UserRecord> {
    const users = this.dataService.getUsers();
    const user = users.find(u => {
      if (orgId) {
        return u.role === role && u.organizationId === orgId;
      }
      return u.role === role;
    });

    if (!user) {
      throw new NotFoundException(`No mock user found for role: ${role} in org: ${orgId}`);
    }

    return { email: user.email };
  }

  getAll(context: RequestContext): UserRecord[] {
    const users = this.dataService.getUsers();
    // Owner sees all platform employees; System Admin sees all users in their org
    if (context.role === 'Owner') {
      return users;
    }
    if (context.role === 'System Admin' || context.role === 'Guest') {
      return users.filter((u) => u.organizationId === context.organizationId);
    }

    const actingUser = context.userId ? this.dataService.getUserById(context.userId) : undefined;
    if (!actingUser) {
      return [];
    }
    return [actingUser];
  }

  /** Owner creates a new platform Employee */
  createEmployee({ name, email, password }: CreateEmployeeDto): UserRecord {
    if (this.dataService.getUserByEmail(email)) {
      throw new BadRequestException('An account with this email already exists.');
    }
    const users = this.dataService.getUsers();
    const empCount = users.filter(u => u.role === 'Employee').length;
    const newId = `EMP-${String(empCount + 1).padStart(3, '0')}-${Date.now()}`;
    const user: UserRecord = {
      id: newId,
      organizationId: 'PLATFORM',
      name,
      email,
      password,
      role: 'Employee',
      status: 'Active',
      preferences: { notifications: true },
    };
    return this.dataService.insertUser(user);
  }

  create(context: RequestContext, payload: CreateUserDto): UserRecord {
    const users = this.dataService.getUsers();
    const newId = `U${users.length + 1}_${Date.now()}`;
    const user: UserRecord = {
      id: newId,
      ...payload,
      organizationId: context.organizationId || 'ORG-001',
      status: payload.status || 'Active',
      preferences: { notifications: true }
    };
    return this.dataService.insertUser(user);
  }

  update(id: string, payload: UpdateUserDto, context: RequestContext): UserRecord {
    this.getScopedUser(id, context);
    return this.dataService.updateUser(id, payload);
  }

  deactivate(id: string, context: RequestContext): UserRecord {
    this.getScopedUser(id, context);
    return this.dataService.updateUser(id, { status: 'Inactive' });
  }

  updateStatus(id: string, status: 'Active' | 'Suspended', context: RequestContext) {
    this.getScopedUser(id, context);
    return this.dataService.updateUser(id, { status });
  }

  private getScopedUser(id: string, context: RequestContext): UserRecord {
    const user = this.dataService.getUserById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    if (context.role !== 'Owner' && context.organizationId && user.organizationId !== context.organizationId) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }
}
