import { Injectable } from '@nestjs/common';
import { DataService } from '../data/data.service';
import { AnnouncementRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { CreateAnnouncementDto } from './dto/announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext): AnnouncementRecord[] {
    const all = this.dataService.getAnnouncements();
    if (context.role === 'Owner' || context.role === 'Employee') {
      return all;
    }
    // Organization users see broadcasts to 'ALL' and specific org announcements
    return all.filter(a => a.targetOrgId === 'ALL' || a.targetOrgId === context.organizationId);
  }

  create(context: RequestContext, payload: CreateAnnouncementDto): AnnouncementRecord {
    const ann: AnnouncementRecord = {
      id: `ANN-${Date.now()}`,
      targetOrgId: payload.targetOrgId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      authorId: context.userId || 'System',
    };
    const saved = this.dataService.insertAnnouncement(ann);

    // Announcements are read on the System Admin's page; a broadcast reaches every organization's admin
    this.dataService.notify({
      organizationId: saved.targetOrgId === 'ALL' ? 'PLATFORM' : saved.targetOrgId,
      recipientRole: 'System Admin',
      title: `New announcement: ${saved.title}`,
      targetType: 'announcement',
      targetId: saved.id,
      description: `${saved.type} — ${saved.message}`,
    });
    return saved;
  }

  addReply(context: RequestContext, annId: string, reply: string): AnnouncementRecord {
    const updated = this.dataService.updateAnnouncement(annId, {
      adminReply: reply,
      adminReplyDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      adminReplyBy: context.userId,
    });

    // Let the author (owner or employee) and the employee managing this organization know
    const org = context.organizationId ? this.dataService.getOrganizationById(context.organizationId) : undefined;
    const description = `${org?.name || 'An organization'} replied to "${updated.title}": ${reply}`;
    const author = this.dataService.getUserById(updated.authorId);
    const recipients = new Map<string, 'Owner' | 'Employee'>();
    if (author && (author.role === 'Owner' || author.role === 'Employee')) recipients.set(author.id, author.role);
    if (org?.assignedEmployeeId) recipients.set(org.assignedEmployeeId, 'Employee');
    recipients.forEach((role, userId) => {
      this.dataService.notify({
        organizationId: 'PLATFORM',
        recipientRole: role,
        recipientUserId: userId,
        title: 'Announcement reply',
        targetType: 'announcement',
        targetId: updated.id,
        description,
      });
    });
    return updated;
  }
}
