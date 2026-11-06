import { Body, Controller, Get, Param, Patch, Req, UseFilters } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto } from '../common/swagger-models';
import { ApiRoleHeaders, ApiStandardErrorResponses } from '../common/swagger';
import { UpdateNotificationDto } from './dto/notification.dto';
import { NotificationsExceptionFilter } from './filters/notifications-exception.filter';

@ApiTags('notifications')
@ApiRoleHeaders()
@ApiStandardErrorResponses()
@Controller('notifications')
@UseFilters(NotificationsExceptionFilter)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications visible to the acting role' })
  @ApiOkResponse({ description: 'Notifications returned successfully.', type: NotificationResponseDto, isArray: true })
  getAll(@Req() req: any) {
    return this.notificationsService.getAll(req.context);
  }

  @Patch(':id')
  @ApiBody({ type: UpdateNotificationDto })
  @ApiOperation({ summary: 'Update a notification state' })
  @ApiParam({ name: 'id', example: 'N1' })
  @ApiOkResponse({ description: 'Notification updated successfully.', type: NotificationResponseDto })
  update(@Param('id') id: string, @Body() body: UpdateNotificationDto, @Req() req: any) {
    return this.notificationsService.update(id, body, req.context);
  }
}
