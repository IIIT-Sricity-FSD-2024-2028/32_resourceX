import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Query,
  UseFilters
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/roles.decorator';
import { UserResponseDto } from '../common/swagger-models';
import { ApiRoleHeaders, ApiStandardErrorResponses } from '../common/swagger';
import { UsersService } from './users.service';
import { CreateEmployeeDto, CreateUserDto, UpdateEmployeeDto, UpdateUserDto } from './dto/user.dto';
import { Public } from '../auth/public.decorator';
import { UsersExceptionFilter } from './filters/users-exception.filter';

@ApiTags('users')
@ApiRoleHeaders()
@ApiStandardErrorResponses()
@Controller('users')
@UseFilters(UsersExceptionFilter)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users visible to the acting role' })
  @ApiOkResponse({ description: 'Users returned for the current actor scope.', type: UserResponseDto, isArray: true })
  getAll(@Req() req: any) {
    return this.usersService.getAll(req.context);
  }

  @Public()
  @Get('mock')
  @ApiOperation({ summary: 'Get a mock user for login testing' })
  getMockUser(@Query('role') role: string, @Query('orgId') orgId?: string) {
    return this.usersService.getMockUser(role, orgId);
  }

  @Post()
  @Roles('System Admin')
  @ApiBody({ type: CreateUserDto })
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ description: 'User created successfully.', type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Only System Admin can create users.' })
  create(@Req() req: any, @Body() dto: CreateUserDto) {
    return this.usersService.create(req.context, dto);
  }

  @Post('create-employee')
  @Roles('Owner')
  @ApiOperation({ summary: 'Owner creates a new platform Employee' })
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.usersService.createEmployee(dto);
  }

  @Patch('employees/:id')
  @Roles('Owner')
  @ApiBody({ type: UpdateEmployeeDto })
  @ApiOperation({ summary: 'Owner edits an employee (name, document, assigned organizations)' })
  @ApiParam({ name: 'id', example: 'EMP-001' })
  updateEmployee(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.usersService.updateEmployee(id, dto);
  }

  @Delete('employees/:id')
  @Roles('Owner')
  @ApiOperation({ summary: 'Owner removes an employee; their organizations become unassigned' })
  @ApiParam({ name: 'id', example: 'EMP-001' })
  removeEmployee(@Param('id') id: string) {
    return this.usersService.removeEmployee(id);
  }

  @Patch(':id')
  @Roles('System Admin')
  @ApiBody({ type: UpdateUserDto })
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', example: 'U4' })
  @ApiOkResponse({ description: 'User updated successfully.', type: UserResponseDto })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto, req.context);
  }

  @Delete(':id')
  @Roles('System Admin')
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiParam({ name: 'id', example: 'U4' })
  @ApiOkResponse({ description: 'User deactivated successfully.', type: UserResponseDto })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.usersService.deactivate(id, req.context);
  }

  @Patch(':id/suspend')
  @Roles('System Admin', 'Owner')
  @ApiOperation({ summary: 'Suspend a user account' })
  suspendUser(@Req() req: any, @Param('id') id: string) {
    return this.usersService.updateStatus(id, 'Suspended', req.context);
  }

  @Patch(':id/reactivate')
  @Roles('System Admin', 'Owner')
  @ApiOperation({ summary: 'Reactivate a user account' })
  reactivateUser(@Req() req: any, @Param('id') id: string) {
    return this.usersService.updateStatus(id, 'Active', req.context);
  }
}
