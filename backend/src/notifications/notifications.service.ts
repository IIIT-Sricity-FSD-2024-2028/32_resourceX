import { Injectable } from '@nestjs/common';
import { NotificationRecord } from '../common/domain';
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
                  description: `URGENT: The scheduled return deadline for "${res.name || res.type}" (${res.id}) expired on ${display || retDate}. Please initiate return immediately from My Resources.`,
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
