import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseFilters } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/roles.decorator';
import {
  DepartmentResourceCatalogResponseDto,
  ResourceAvailabilityResponseDto,
  ResourceResponseDto,
} from '../common/swagger-models';
import { ApiRoleHeaders, ApiStandardErrorResponses } from '../common/swagger';
import { ResourcesService } from './resources.service';
import { CreateResourceDto, UpdateResourceDto, UpdateCatalogDto, RequestMaintenanceDto, InitiateReturnDto } from './dto/resource.dto';
import { ResourcesExceptionFilter } from './filters/resources-exception.filter';

@ApiTags('resources')
@ApiRoleHeaders()
@ApiStandardErrorResponses()
@Controller('resources')
@UseFilters(ResourcesExceptionFilter)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) { }

  @Get('catalog')
  @ApiOperation({ summary: 'List static resource types configured per department' })
  @ApiQuery({ name: 'department', required: false, example: 'IT Services' })
  @ApiOkResponse({
    description: 'Department resource-type catalog returned successfully.',
    type: DepartmentResourceCatalogResponseDto,
    isArray: true,
  })
  getCatalog(@Query('department') department?: string) {
    return this.resourcesService.getCatalog(department);
  }

  @Get('availability')
  @ApiOperation({ summary: 'Get available inventory count for a department resource type' })
  @ApiQuery({ name: 'department', required: true, example: 'IT Services' })
  @ApiQuery({ name: 'type', required: true, example: 'Laptop' })
  @ApiOkResponse({
    description: 'Department inventory availability returned successfully.',
    type: ResourceAvailabilityResponseDto,
  })
  getAvailability(
    @Query('department') department: string,
    @Query('type') type: string,
  ) {
    return this.resourcesService.getAvailability(department, type);
  }

  @Get()
  @ApiOperation({ summary: 'List resources visible to the acting role' })
  @ApiQuery({ name: 'status', required: false, example: 'Available' })
  @ApiQuery({ name: 'department', required: false, example: 'IT Services' })
  @ApiQuery({ name: 'type', required: false, example: 'Laptop' })
  @ApiQuery({ name: 'assignedToId', required: false, example: 'U101' })
  @ApiOkResponse({ description: 'Resources returned successfully.', type: ResourceResponseDto, isArray: true })
  getAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('department') department?: string,
    @Query('type') type?: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.resourcesService.getAll(req.context, {
      status,
      department,
      type,
      assignedToId,
    });
  }

  @Post()
  @Roles('Inventory Officer', 'System Admin')
  @ApiBody({ type: CreateResourceDto })
  @ApiOperation({ summary: 'Create an inventory resource' })
  @ApiCreatedResponse({ description: 'Resource created successfully.', type: ResourceResponseDto })
  create(@Body() dto: CreateResourceDto, @Req() req: any) {
    return this.resourcesService.create(dto, req.context);
  }

  @Patch(':id')
  @Roles('Requestor', 'Inventory Officer', 'System Admin')
  @ApiBody({ type: UpdateResourceDto })
  @ApiOperation({ summary: 'Update a resource' })
  @ApiParam({ name: 'id', example: 'RES-1049' })
  @ApiOkResponse({ description: 'Resource updated successfully.', type: ResourceResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateResourceDto) {
    return this.resourcesService.update(id, dto);
  }

  @Post(':id/maintenance-request')
  @Roles('Requestor', 'System Admin')
  @ApiOperation({ summary: 'Request maintenance for an allocated resource' })
  @ApiParam({ name: 'id', example: 'RES-1049' })
  @ApiOkResponse({ description: 'Maintenance requested successfully.', type: ResourceResponseDto })
  requestMaintenance(@Param('id') id: string, @Body() dto: RequestMaintenanceDto, @Req() req: any) {
    return this.resourcesService.requestMaintenance(id, dto, req.context);
  }

  @Post(':id/initiate-return')
  @Roles('Requestor', 'System Admin')
  @ApiOperation({ summary: 'Initiate a return request for an allocated resource' })
  @ApiParam({ name: 'id', example: 'RES-9055' })
  @ApiOkResponse({ description: 'Return initiated successfully.', type: ResourceResponseDto })
  initiateReturn(@Param('id') id: string, @Body() dto: InitiateReturnDto, @Req() req: any) {
    return this.resourcesService.initiateReturn(id, dto, req.context);
  }

  @Post(':id/confirm-repaired')
  @Roles('Requestor', 'System Admin')
  @ApiOperation({ summary: 'Confirm repaired resource allocation' })
  @ApiParam({ name: 'id', example: 'RES-1049' })
  @ApiOkResponse({ description: 'Repaired allocation confirmed successfully.', type: ResourceResponseDto })
  confirmRepaired(@Param('id') id: string, @Req() req: any) {
    return this.resourcesService.confirmRepaired(id, req.context);
  }

  @Post(':id/scrap')
  @Roles('Inventory Officer', 'System Admin')
  @ApiOperation({ summary: 'Scrap a resource' })
  @ApiParam({ name: 'id', example: 'RES-5011' })
  @ApiOkResponse({ description: 'Resource marked as scrapped successfully.', type: ResourceResponseDto })
  scrap(@Param('id') id: string) {
    return this.resourcesService.scrap(id);
  }

  @Post('catalog')
  @Roles('System Admin')
  @ApiBody({ type: UpdateCatalogDto })
  @ApiOperation({ summary: 'Update resource catalog for a department' })
  @ApiCreatedResponse({ description: 'Catalog updated successfully.', type: DepartmentResourceCatalogResponseDto })
  updateCatalog(@Body() dto: UpdateCatalogDto, @Req() req: any) {
    return this.resourcesService.updateCatalog(dto, req.context);
  }
}
