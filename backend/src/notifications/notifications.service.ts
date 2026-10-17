import { Injectable } from '@nestjs/common';
import { NotificationRecord, RecipientRole } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { UpdateNotificationDto } from './dto/notification.dto';

import { getActingUser, resourceMatchesType } from '../common/utils';

@Injectable()
export class NotificationsService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext): NotificationRecord[] {
    if (context.role === 'Requestor') {
      const user = getActingUser(this.dataService, context);
      const allocatedResources = this.dataService.getResources().filter(
        (r) => (r.assignedToId === user?.id || r.assignedTo === user?.name) && r.status === 'Allocated'
      );
      const now = Date.now();

      for (const res of allocatedResources) {
        let retDate = res.returnDate;
        let display = res.returnDateDisplay;
        if (!retDate) {
          const req = this.dataService.getRequests().find(
            (q) => (q.requestorId === user?.id || q.requestor === user?.name) &&
                   resourceMatchesType(res, q.resourceType) &&
                   q.returnDate
          );
          if (req) {
            retDate = req.returnDate;
            display = req.returnDateDisplay;
          }
        }

        if (retDate) {
          const parsed = Date.parse(retDate);
          if (!isNaN(parsed)) {
            const deadline = new Date(parsed);
            deadline.setHours(23, 59, 59, 999);
            if (now > deadline.getTime()) {
              const notifId = `NOTIF-RETURN-OVERDUE-${res.id}`;
              const exists = this.dataService.getNotifications().some((n) => n.id === notifId);
              if (!exists) {
                this.dataService.insertNotification({
                  id: notifId,
                  organizationId: context.organizationId || 'ORG-001',
                  title: `🚨 ACTION REQUIRED: Return Overdue Resource (${res.name || res.type})`,
                  description: `URGENT: The scheduled return deadline for "${res.name || res.type}" (${res.id}) expired on ${display || retDate}. Please initiate return or request an extension from My Resources immediately.`,
                  time: 'Just now',
                  read: false,
                  recipientRole: 'Requestor',
                });
              }
            } else {
              const diffMs = deadline.getTime() - now;
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              if (diffDays <= 3) {
                const notifId = `NOTIF-DEADLINE-APPROACHING-${res.id}`;
                const exists = this.dataService.getNotifications().some((n) => n.id === notifId);
                if (!exists) {
                  this.dataService.insertNotification({
                    id: notifId,
                    organizationId: context.organizationId || 'ORG-001',
                    title: `⏰ DEADLINE APPROACHING: Return scheduled for ${res.name || res.type}`,
                    description: `Reminder: "${res.name || res.type}" (${res.id}) is due for return in ${diffDays <= 1 ? '1 day (tomorrow)' : `${diffDays} days`} on ${display || retDate}. If you need more time, you can request an extension from My Resources.`,
                    time: 'Just now',
                    read: false,
                    recipientRole: 'Requestor',
                  });
                }
              }
            }
          }
        }
      }
    }

    if (context.role === 'Procurement Officer' || context.role === 'Inventory Officer' || (context.role as string) === 'Staff') {
      const procs = this.dataService.getProcurements().filter(
        (p) => !['Fulfilled', 'Registered', 'Rejected'].includes(p.status) && (p.targetDate || p.expectedDeliveryDate)
      );
      const now = Date.now();

      for (const proc of procs) {
        const tDate = proc.targetDate || proc.expectedDeliveryDate;
        const display = proc.targetDateDisplay || tDate;
        const parsed = Date.parse(tDate!);
        if (!isNaN(parsed)) {
          const deadline = new Date(parsed);
          deadline.setHours(23, 59, 59, 999);
          const diffMs = deadline.getTime() - now;
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          const recipientRole: RecipientRole = context.role === 'Guest' ? 'Procurement Officer' : (context.role as RecipientRole);

          if (diffDays <= 3 && diffDays >= 0) {
            const notifId = `NOTIF-PROC-APPROACHING-${proc.id}-${context.role.toLowerCase()}`;
            const exists = this.dataService.getNotifications().some((n) => n.id === notifId);
            if (!exists) {
              this.dataService.insertNotification({
                id: notifId,
                organizationId: proc.organizationId || context.organizationId || 'ORG-001',
                title: `⏰ PROCUREMENT DEADLINE APPROACHING: ${proc.item || proc.resourceType}`,
                description: `Reminder: Procurement ${proc.id} for "${proc.item || proc.resourceType}" (${proc.department}) is due in ${diffDays <= 1 ? '1 day (tomorrow)' : `${diffDays} days`} on ${display}. Please expedite vendor fulfillment.`,
                time: 'Just now',
                read: false,
                recipientRole,
              });
            }
          } else if (diffMs < 0) {
            const notifId = `NOTIF-PROC-OVERDUE-${proc.id}-${context.role.toLowerCase()}`;
            const exists = this.dataService.getNotifications().some((n) => n.id === notifId);
            if (!exists) {
              this.dataService.insertNotification({
                id: notifId,
                organizationId: proc.organizationId || context.organizationId || 'ORG-001',
                title: `⚠️ PROCUREMENT PAST TARGET DATE: ${proc.item || proc.resourceType}`,
                description: `Notice: Procurement ${proc.id} for "${proc.item || proc.resourceType}" was targeted for completion by ${display}. It can still be processed and fulfilled.`,
                time: 'Just now',
                read: false,
                recipientRole,
              });
            }
          }
        }
      }
    }

    let notifications = this.dataService.getNotifications();
    // Organization isolation — scope to user's org (allow 'PLATFORM' broadcast notifications)
    if (context.organizationId) {
      notifications = notifications.filter(
        (n) => !n.organizationId || n.organizationId === context.organizationId || n.organizationId === 'PLATFORM'
      );
    }
    return notifications.filter(
      (notification) =>
        notification.recipientRole === 'All' ||
        notification.recipientRole === context.role
    );
  }

  update(id: string, payload: UpdateNotificationDto): NotificationRecord {
    return this.dataService.updateNotification(id, payload);
  }
}
