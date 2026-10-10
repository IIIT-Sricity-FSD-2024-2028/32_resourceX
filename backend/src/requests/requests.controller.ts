import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseFilters } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/roles.decorator';
import { RequestResponseDto } from '../common/swagger-models';
import { ApiRoleHeaders, ApiStandardErrorResponses } from '../common/swagger';
import { RequestsService } from './requests.service';
import { AllocateRequestDto, CreateRequestDto, UpdateRequestDto } from './dto/request.dto';
import { RequestsExceptionFilter } from './filters/requests-exception.filter';

@ApiTags('requests')
@ApiRoleHeaders()
@ApiStandardErrorResponses()
@Controller('requests')
@UseFilters(RequestsExceptionFilter)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @ApiOperation({ summary: 'List requests visible to the acting role' })
  @ApiQuery({ name: 'status', required: false, example: 'Pending' })
  @ApiQuery({ name: 'department', required: false, example: 'IT Services' })
  @ApiOkResponse({ description: 'Requests returned successfully.', type: RequestResponseDto, isArray: true })
  getAll(@Req() req: any, @Query('status') status?: string, @Query('department') department?: string) {
    return this.requestsService.getAll(req.context, { status, department });
  }

  @Post()
  @Roles('Requestor', 'Staff', 'System Admin')
  @ApiBody({ type: CreateRequestDto })
  @ApiOperation({ summary: 'Create a resource request' })
  @ApiCreatedResponse({ description: 'Request created successfully.', type: RequestResponseDto })
  create(@Body() dto: CreateRequestDto, @Req() req: any) {
    return this.requestsService.create(dto, req.context);
  }

  @Patch(':id')
  @Roles('Dept Head', 'Staff', 'System Admin')
  @ApiBody({ type: UpdateRequestDto })
  @ApiOperation({ summary: 'Update a request' })
  @ApiParam({ name: 'id', example: 'REQ-102' })
  @ApiOkResponse({ description: 'Request updated successfully.', type: RequestResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateRequestDto) {
    return this.requestsService.update(id, dto);
  }

  @Post(':id/approve')
  @Roles('Dept Head', 'System Admin')
  @ApiOperation({ summary: 'Approve a request' })
  @ApiParam({ name: 'id', example: 'REQ-102' })
  @ApiOkResponse({ description: 'Request approved successfully.', type: RequestResponseDto })
  approve(@Param('id') id: string, @Req() req: any) {
    return this.requestsService.approve(id, req.context);
  }

  @Post(':id/reject')
  @Roles('Dept Head', 'System Admin')
  @ApiOperation({ summary: 'Reject a request' })
  @ApiParam({ name: 'id', example: 'REQ-103' })
  @ApiOkResponse({ description: 'Request rejected successfully.', type: RequestResponseDto })
  reject(@Param('id') id: string, @Req() req: any) {
    return this.requestsService.reject(id, req.context);
  }

  @Post(':id/allocate')
  @Roles('Staff', 'System Admin')
  @ApiBody({ type: AllocateRequestDto })
  @ApiOperation({ summary: 'Allocate inventory resources to an approved request' })
  @ApiParam({ name: 'id', example: 'REQ-104' })
  @ApiOkResponse({ description: 'Request allocated successfully.', type: RequestResponseDto })
  allocate(@Param('id') id: string, @Body() dto: AllocateRequestDto, @Req() req: any) {
    return this.requestsService.allocate(id, dto.resourceIds || [], req.context);
  }

  @Post(':id/receipt')
  @Roles('Requestor', 'System Admin')
  @ApiOperation({ summary: 'Confirm request receipt from the requestor side' })
  @ApiParam({ name: 'id', example: 'REQ-101' })
  @ApiOkResponse({ description: 'Receipt confirmed successfully.', type: RequestResponseDto })
  confirmReceipt(@Param('id') id: string, @Req() req: any) {
    return this.requestsService.confirmReceipt(id, req.context);
  }
}
