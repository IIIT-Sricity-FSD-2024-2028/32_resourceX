import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseFilters } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/roles.decorator';
import { ProcurementResponseDto } from '../common/swagger-models';
import { ApiRoleHeaders, ApiStandardErrorResponses } from '../common/swagger';
import { ProcurementsService } from './procurements.service';
import { ProcurementsExceptionFilter } from './filters/procurements-exception.filter';
import {
  CancelProcurementDto,
  CreateProcurementDto,
  CreatePurchaseOrderDto,
  DispatchDeliveryDto,
  EditProcurementDto,
  LogPurchaseDto,
  RejectProcurementDto,
  RegisterProcurementDto,
  UpdateProcurementDto,
} from './dto/procurement.dto';

@ApiTags('procurements')
@ApiRoleHeaders()
@ApiStandardErrorResponses()
@Controller('procurements')
@UseFilters(ProcurementsExceptionFilter)
export class ProcurementsController {
  constructor(private readonly procurementsService: ProcurementsService) { }

  @Get()
  @ApiOperation({ summary: 'List procurements visible to the acting role' })
  @ApiQuery({ name: 'status', required: false, example: 'Pending' })
  @ApiQuery({ name: 'department', required: false, example: 'IT Services' })
  @ApiOkResponse({ description: 'Procurements returned successfully.', type: ProcurementResponseDto, isArray: true })
  getAll(@Req() req: any, @Query('status') status?: string, @Query('department') department?: string) {
    return this.procurementsService.getAll(req.context, { status, department });
  }

  @Post()
  @Roles('Requestor', 'Dept Head', 'System Admin')
  @ApiBody({ type: CreateProcurementDto })
  @ApiOperation({ summary: 'Create a procurement request' })
  @ApiCreatedResponse({ description: 'Procurement created successfully.', type: ProcurementResponseDto })
  create(@Body() dto: CreateProcurementDto, @Req() req: any) {
    return this.procurementsService.create(dto, req.context);
  }

  @Patch(':id')
  @Roles('Dept Head', 'Registrar', 'Procurement Officer', 'System Admin')
  @ApiBody({ type: UpdateProcurementDto })
  @ApiOperation({ summary: 'Update a procurement' })
  @ApiParam({ name: 'id', example: 'PROC-819' })
  @ApiOkResponse({ description: 'Procurement updated successfully.', type: ProcurementResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateProcurementDto, @Req() req: any) {
    return this.procurementsService.update(id, dto, req.context);
  }

  @Post(':id/edit')
  @Roles('Dept Head', 'System Admin')
  @ApiBody({ type: EditProcurementDto })
  @ApiOperation({ summary: 'Edit a department procurement while it awaits registrar review' })
  @ApiParam({ name: 'id', example: 'PROC-819' })
  @ApiOkResponse({ description: 'Procurement edited successfully.', type: ProcurementResponseDto })
  edit(@Param('id') id: string, @Body() dto: EditProcurementDto, @Req() req: any) {
    return this.procurementsService.edit(id, dto, req.context);
  }

  @Post(':id/cancel')
  @Roles('Dept Head', 'System Admin')
  @ApiBody({ type: CancelProcurementDto, required: false })
  @ApiOperation({ summary: 'Cancel a department procurement before a purchase order is issued' })
  @ApiParam({ name: 'id', example: 'PROC-819' })
  @ApiOkResponse({ description: 'Procurement cancelled successfully.', type: ProcurementResponseDto })
  cancel(@Param('id') id: string, @Body() dto: CancelProcurementDto, @Req() req: any) {
    return this.procurementsService.cancel(id, dto?.reason, req.context);
  }

  @Post(':id/department-approve')
  @Roles('Dept Head', 'System Admin')
  @ApiOperation({ summary: 'Approve a procurement as department head' })
  @ApiParam({ name: 'id', example: 'PROC-819' })
  @ApiOkResponse({ description: 'Procurement moved to registrar review.', type: ProcurementResponseDto })
  departmentApprove(@Param('id') id: string, @Req() req: any) {
    return this.procurementsService.departmentApprove(id, req.context);
  }

  @Post(':id/department-reject')
  @Roles('Dept Head', 'System Admin')
  @ApiBody({ type: RejectProcurementDto })
  @ApiOperation({ summary: 'Reject a procurement as department head (reason required)' })
  @ApiParam({ name: 'id', example: 'PROC-821' })
  @ApiOkResponse({ description: 'Procurement rejected successfully.', type: ProcurementResponseDto })
  departmentReject(@Param('id') id: string, @Body() dto: RejectProcurementDto, @Req() req: any) {
    return this.procurementsService.departmentReject(id, dto?.reason, req.context);
  }

  @Post(':id/registrar-approve')
  @Roles('Registrar', 'System Admin')
  @ApiOperation({ summary: 'Approve a procurement as registrar' })
  @ApiParam({ name: 'id', example: 'PROC-819' })
  @ApiOkResponse({ description: 'Procurement approved successfully.', type: ProcurementResponseDto })
  registrarApprove(@Param('id') id: string, @Req() req: any) {
    return this.procurementsService.registrarApprove(id, req.context);
  }

  @Post(':id/registrar-reject')
  @Roles('Registrar', 'System Admin')
  @ApiBody({ type: RejectProcurementDto })
  @ApiOperation({ summary: 'Reject a procurement as registrar (reason required)' })
  @ApiParam({ name: 'id', example: 'PROC-819' })
  @ApiOkResponse({ description: 'Procurement rejected successfully.', type: ProcurementResponseDto })
  registrarReject(@Param('id') id: string, @Body() dto: RejectProcurementDto, @Req() req: any) {
    return this.procurementsService.registrarReject(id, dto?.reason, req.context);
  }

  @Post(':id/create-po')
  @Roles('Procurement Officer', 'System Admin')
  @ApiBody({ type: CreatePurchaseOrderDto })
  @ApiOperation({ summary: 'Issue a purchase order for an approved procurement' })
  @ApiParam({ name: 'id', example: 'PROC-911' })
  @ApiOkResponse({ description: 'Purchase order created successfully.', type: ProcurementResponseDto })
  createPurchaseOrder(@Param('id') id: string, @Body() dto: CreatePurchaseOrderDto, @Req() req: any) {
    return this.procurementsService.createPurchaseOrder(id, dto, req.context);
  }

  @Post(':id/dispatch')
  @Roles('Procurement Officer', 'System Admin')
  @ApiBody({ type: DispatchDeliveryDto })
  @ApiOperation({ summary: 'Mark order as out for delivery / in transit with courier details' })
  @ApiParam({ name: 'id', example: 'PROC-911' })
  @ApiOkResponse({ description: 'Order marked out for delivery successfully.', type: ProcurementResponseDto })
  dispatchDelivery(@Param('id') id: string, @Body() dto: DispatchDeliveryDto, @Req() req: any) {
    return this.procurementsService.dispatchDelivery(id, dto, req.context);
  }

  @Post(':id/log-purchase')
  @Roles('Procurement Officer', 'System Admin')
  @ApiBody({ type: LogPurchaseDto })
  @ApiOperation({ summary: 'Log invoice and fulfill purchases for an order' })
  @ApiParam({ name: 'id', example: 'PROC-911' })
  @ApiOkResponse({ description: 'Purchase log and invoice saved successfully.', type: ProcurementResponseDto })
  logPurchase(@Param('id') id: string, @Body() dto: LogPurchaseDto, @Req() req: any) {
    return this.procurementsService.logPurchase(id, dto, req.context);
  }

  @Post(':id/register')
  @Roles('Inventory Officer', 'System Admin')
  @ApiBody({ type: RegisterProcurementDto })
  @ApiOperation({ summary: 'Register delivered assets for a fulfilled procurement' })
  @ApiParam({ name: 'id', example: 'PROC-850' })
  @ApiOkResponse({ description: 'Procurement assets registered successfully.', type: ProcurementResponseDto })
  register(@Param('id') id: string, @Body() dto: RegisterProcurementDto, @Req() req: any) {
    return this.procurementsService.register(id, dto.resources || [], req.context);
  }
}
