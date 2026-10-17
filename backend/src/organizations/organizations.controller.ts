import { BadRequestException, Body, Controller, Get, Param, Post, Patch, Req, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../common/roles.decorator';
import { RegisterOrgDto } from './dto/organization.dto';
import { OrganizationsExceptionFilter } from './filters/organizations-exception.filter';

@ApiTags('Organizations')
@Controller('organizations')
@UseFilters(OrganizationsExceptionFilter)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Roles('Owner', 'Employee')
  @Get()
  @ApiOperation({ summary: 'List all organizations (Owner and Employee)' })
  getAll() {
    return this.organizationsService.getAll();
  }

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'List all active organizations for login selection' })
  getPublicOrganizations() {
    return this.organizationsService.getPublicOrganizations();
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new organization (Public)' })
  @ApiBody({ type: RegisterOrgDto })
  register(@Body() dto: RegisterOrgDto) {
    return this.organizationsService.register(dto);
  }

  @Roles('Owner')
  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve an organization and assign an employee' })
  approveOrganization(@Param('id') id: string, @Body('employeeId') employeeId: string) {
    return this.organizationsService.updateStatus(id, 'Active', employeeId);
  }

  @Roles('Owner')
  @Patch(':id/assign-employee')
  @ApiOperation({ summary: 'Change the employee assigned to an organization' })
  assignEmployee(@Param('id') id: string, @Body('employeeId') employeeId: string) {
    if (!employeeId) {
      throw new BadRequestException('employeeId is required.');
    }
    return this.organizationsService.assignEmployee(id, employeeId);
  }

  @Patch(':id/suspend')
  @Roles('Owner', 'Employee')
  @ApiOperation({ summary: 'Suspend an organization' })
  suspendOrganization(@Param('id') id: string) {
    return this.organizationsService.updateStatus(id, 'Suspended');
  }

  @Patch(':id/reactivate')
  @Roles('Owner', 'Employee')
  @ApiOperation({ summary: 'Reactivate an organization' })
  reactivateOrganization(@Param('id') id: string) {
    return this.organizationsService.updateStatus(id, 'Active');
  }

  @Roles('System Admin')
  @Get('my-org/details')
  @ApiOperation({ summary: 'Get details of the current organization (System Admin)' })
  getMyOrganization(@Body() _body: any, @Param() _param: any, @Req() req: any) {
    const orgId = req.context.organizationId;
    return this.organizationsService.getMyOrganization(orgId);
  }

  @Roles('System Admin')
  @Patch('my-org/subscription')
  @ApiOperation({ summary: 'Update subscription plan for the current organization' })
  updateMySubscription(@Body('planId') planId: string, @Req() req: any) {
    const orgId = req.context.organizationId;
    return this.organizationsService.updateSubscription(orgId, planId);
  }
}
