import { Body, Controller, Get, Param, Post, Req, UseFilters } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/roles.decorator';
import { MaintenanceHistoryResponseDto, ResourceResponseDto } from '../common/swagger-models';
import { ApiRoleHeaders, ApiStandardErrorResponses } from '../common/swagger';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceExceptionFilter } from './filters/maintenance-exception.filter';
import { AcceptMaintenanceDto, ResolveMaintenanceDto } from './dto/maintenance.dto';

@ApiTags('maintenance')
@ApiRoleHeaders()
@ApiStandardErrorResponses()
@Controller('maintenance')
@UseFilters(MaintenanceExceptionFilter)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get maintenance history visible to the acting role' })
  @ApiOkResponse({ description: 'Maintenance history returned successfully.', type: MaintenanceHistoryResponseDto, isArray: true })
  getHistory(@Req() req: any) {
    return this.maintenanceService.getHistory(req.context);
  }

  @Post(':resourceId/accept')
  @Roles('Maintenance Officer', 'System Admin')
  @ApiOperation({ summary: 'Accept a maintenance request' })
  @ApiParam({ name: 'resourceId', example: 'RES-5011' })
  @ApiOkResponse({ description: 'Maintenance request accepted successfully.', type: ResourceResponseDto })
  accept(
    @Param('resourceId') resourceId: string,
    @Body() dto: AcceptMaintenanceDto,
    @Req() req: any
  ) {
    return this.maintenanceService.accept(resourceId, dto, req.context);
  }

  @Post(':resourceId/repair')
  @Roles('Maintenance Officer', 'System Admin')
  @ApiOperation({ summary: 'Mark a resource as repaired' })
  @ApiParam({ name: 'resourceId', example: 'RES-5013' })
  @ApiOkResponse({ description: 'Resource marked as repaired successfully.', type: ResourceResponseDto })
  repair(
    @Param('resourceId') resourceId: string,
    @Body() dto: ResolveMaintenanceDto,
    @Req() req: any
  ) {
    return this.maintenanceService.repair(resourceId, dto, req.context);
  }

  @Post(':resourceId/scrap')
  @Roles('Maintenance Officer', 'System Admin')
  @ApiOperation({ summary: 'Scrap a resource from the maintenance flow' })
  @ApiParam({ name: 'resourceId', example: 'RES-5013' })
  @ApiOkResponse({ description: 'Resource scrapped successfully.', type: ResourceResponseDto })
  scrap(
    @Param('resourceId') resourceId: string,
    @Body() dto: ResolveMaintenanceDto,
    @Req() req: any
  ) {
    return this.maintenanceService.scrap(resourceId, dto, req.context);
  }
}
