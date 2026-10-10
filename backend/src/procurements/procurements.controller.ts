import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseFilters } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/roles.decorator';
import { ProcurementResponseDto } from '../common/swagger-models';
import { ApiRoleHeaders, ApiStandardErrorResponses } from '../common/swagger';
import { ProcurementsService } from './procurements.service';
import { ProcurementsExceptionFilter } from './filters/procurements-exception.filter';
import {
  CreateProcurementDto,
  LogPurchaseDto,
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
  @Roles('Dept Head', 'Registrar', 'Staff', 'System Admin')
  @ApiBody({ type: UpdateProcurementDto })
  @ApiOperation({ summary: 'Update a procurement' })
  @ApiParam({ name: 'id', example: 'PROC-819' })
  @ApiOkResponse({ description: 'Procurement updated successfully.', type: ProcurementResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateProcurementDto, @Req() req: any) {
    return this.procurementsService.update(id, dto, req.context);
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
  @ApiOperation({ summary: 'Reject a procurement as department head' })
  @ApiParam({ name: 'id', example: 'PROC-821' })
  @ApiOkResponse({ description: 'Procurement rejected successfully.', type: ProcurementResponseDto })
  departmentReject(@Param('id') id: string, @Req() req: any) {
    return this.procurementsService.departmentReject(id, req.context);
  }

  @Post(':id/registrar-approve')
  @Roles('Registrar', 'System Admin')
  @ApiOperation({ summary: 'Approve a procurement as registrar' })
  @ApiParam({ name: 'id', example: 'PROC-819' })
  @ApiOkResponse({ description: 'Procurement approved successfully.', type: ProcurementResponseDto })
  registrarApprove(@Param('id') id: string) {
    return this.procurementsService.registrarApprove(id);
  }

  @Post(':id/registrar-reject')
  @Roles('Registrar', 'System Admin')
  @ApiOperation({ summary: 'Reject a procurement as registrar' })
  @ApiParam({ name: 'id', example: 'PROC-819' })
  @ApiOkResponse({ description: 'Procurement rejected successfully.', type: ProcurementResponseDto })
  registrarReject(@Param('id') id: string) {
    return this.procurementsService.registrarReject(id);
  }

  @Post(':id/log-purchase')
  @Roles('Staff', 'System Admin')
  @ApiBody({ type: LogPurchaseDto })
  @ApiOperation({ summary: 'Log vendor and invoice details for an approved procurement' })
  @ApiParam({ name: 'id', example: 'PROC-911' })
  @ApiOkResponse({ description: 'Purchase log saved successfully.', type: ProcurementResponseDto })
  logPurchase(@Param('id') id: string, @Body() dto: LogPurchaseDto, @Req() req: any) {
    return this.procurementsService.logPurchase(id, dto, req.context);
  }

  @Post(':id/register')
  @Roles('Staff', 'System Admin')
  @ApiBody({ type: RegisterProcurementDto })
  @ApiOperation({ summary: 'Register delivered assets for a fulfilled procurement' })
  @ApiParam({ name: 'id', example: 'PROC-850' })
  @ApiOkResponse({ description: 'Procurement assets registered successfully.', type: ProcurementResponseDto })
  register(@Param('id') id: string, @Body() dto: RegisterProcurementDto, @Req() req: any) {
    return this.procurementsService.register(id, dto.resources || [], req.context);
  }
}
