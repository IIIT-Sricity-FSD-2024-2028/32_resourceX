import { Body, Controller, Get, Param, Post, Req, UseFilters } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/roles.decorator';
import { ResourceResponseDto, ReturnHistoryResponseDto } from '../common/swagger-models';
import { ApiRoleHeaders, ApiStandardErrorResponses } from '../common/swagger';
import { ReturnsService } from './returns.service';
import { ReturnProcessDto } from './dto/return.dto';
import { ReturnsExceptionFilter } from './filters/returns-exception.filter';

@ApiTags('returns')
@ApiRoleHeaders()
@ApiStandardErrorResponses()
@Controller('returns')
@UseFilters(ReturnsExceptionFilter)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get return history visible to the acting role' })
  @ApiOkResponse({ description: 'Return history returned successfully.', type: ReturnHistoryResponseDto, isArray: true })
  getHistory(@Req() req: any) {
    return this.returnsService.getHistory(req.context);
  }

  @Post(':resourceId/process')
  @Roles('Maintenance Officer', 'System Admin')
  @ApiBody({ type: ReturnProcessDto })
  @ApiOperation({ summary: 'Process a returned resource' })
  @ApiParam({ name: 'resourceId', example: 'RES-6001' })
  @ApiOkResponse({ description: 'Return processed successfully.', type: ResourceResponseDto })
  process(@Param('resourceId') resourceId: string, @Body() dto: ReturnProcessDto, @Req() req: any) {
    return this.returnsService.process(resourceId, dto.condition, req.context);
  }
}
