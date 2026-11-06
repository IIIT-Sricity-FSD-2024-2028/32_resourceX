import { Injectable } from '@nestjs/common';
import { DataService } from '../data/data.service';
import { SupportTicketRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { CreateTicketDto, ResolveTicketDto } from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext): SupportTicketRecord[] {
    const all = this.dataService.getSupportTickets();
    if (context.role === 'Employee') {
      // Employees see tickets for organizations they are assigned to
      const myOrgs = this.dataService.getOrganizations().filter(o => o.assignedEmployeeId === context.userId).map(o => o.id);
      return all.filter(t => myOrgs.includes(t.organizationId));
    }
    if (context.role === 'Owner') {
      return all;
    }
    // Normal users see only their org's tickets
    return all.filter(t => t.organizationId === context.organizationId);
  }

  create(context: RequestContext, payload: CreateTicketDto): SupportTicketRecord {
    const user = this.dataService.getUserById(context.userId || '');
    const ticket: SupportTicketRecord = {
      id: `TKT-${Date.now()}`,
      organizationId: context.organizationId || 'ORG-001',
      title: payload.title,
      description: payload.description,
      status: 'Open',
      createdBy: user ? user.name : 'Unknown',
      createdById: context.userId || '',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    const saved = this.dataService.insertSupportTicket(ticket);

    // Platform side: the owner sees every ticket, the employee managing this organization sees theirs
    const org = this.dataService.getOrganizationById(saved.organizationId);
    const description = `${saved.createdBy} (${org?.name || saved.organizationId}) opened ticket ${saved.id}: ${saved.title}`;
    this.dataService.notify({
      organizationId: 'PLATFORM',
      recipientRole: 'Owner',
      title: 'New support ticket',
      targetType: 'ticket',
      targetId: saved.id,
      description,
    });
    if (org?.assignedEmployeeId) {
      this.dataService.notify({
        organizationId: 'PLATFORM',
        recipientRole: 'Employee',
        recipientUserId: org.assignedEmployeeId,
        title: 'New support ticket',
        targetType: 'ticket',
        targetId: saved.id,
        description,
      });
    }
    return saved;
  }

  resolve(id: string, payload: ResolveTicketDto): SupportTicketRecord {
    const updated = this.dataService.updateSupportTicket(id, {
      reply: payload.reply,
      status: payload.status || 'Resolved'
    });

    // Tell whoever raised the ticket that it was answered
    const creator = this.dataService.getUserById(updated.createdById);
    if (creator) {
      this.dataService.notify({
        organizationId: updated.organizationId,
        recipientRole: creator.role,
        recipientUserId: creator.id,
        title: `Support ticket ${updated.status === 'Resolved' ? 'resolved' : 'updated'}`,
        targetType: 'ticket',
        targetId: updated.id,
        description: `Your ticket "${updated.title}" was ${updated.status === 'Resolved' ? 'resolved' : 'answered'}${payload.reply ? `: ${payload.reply}` : '.'}`,
      });
    }
    return updated;
  }
}
