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
    return this.dataService.insertAnnouncement(ann);
  }

  addReply(context: RequestContext, annId: string, reply: string): AnnouncementRecord {
    return this.dataService.updateAnnouncement(annId, {
      adminReply: reply,
      adminReplyDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      adminReplyBy: context.userId,
    });
  }
}
