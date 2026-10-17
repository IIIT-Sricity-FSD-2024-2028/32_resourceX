import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { UpdatePasswordDto, UpdateProfileDto } from './dto/profile.dto';
import { getActingUser } from '../common/utils';

@Injectable()
export class ProfileService {
  constructor(private readonly dataService: DataService) {}

  getMe(context: RequestContext): UserRecord & { organizationName?: string } {
    const user = getActingUser(this.dataService, context);
    if (!user) {
      throw new NotFoundException('Active user profile not found.');
    }
    const org = this.dataService.getOrganizationById(user.organizationId || '');
    return { ...user, organizationName: org?.name };
  }

  updateProfile(context: RequestContext, payload: UpdateProfileDto): UserRecord {
    const user = getActingUser(this.dataService, context);
    if (!user) {
      throw new BadRequestException('Active demo user not found.');
    }
    return this.dataService.updateUser(user.id, {
      name: payload.name ?? user.name,
      preferences: {
        notifications:
          typeof payload.notifications === 'boolean'
            ? payload.notifications
            : user.preferences?.notifications ?? true,
      },
    });
  }

  updatePassword(context: RequestContext, payload: UpdatePasswordDto): UserRecord {
    const user = getActingUser(this.dataService, context);
    if (!user) {
      throw new BadRequestException('Active demo user not found.');
    }
    if ((user.password || '') !== payload.currentPassword) {
      throw new BadRequestException('Current password is incorrect.');
    }
    return this.dataService.updateUser(user.id, { password: payload.newPassword });
  }
}
