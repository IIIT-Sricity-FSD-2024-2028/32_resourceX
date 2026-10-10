import { BadRequestException, Controller, Get, Patch, Param, Req, UseFilters } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../common/roles.decorator';
import {
  DepartmentSummaryResponseDto,
  RegistrarSummaryResponseDto,
  RequestorSummaryResponseDto,
  StockRowResponseDto,
} from '../common/swagger-models';
import { ApiRoleHeaders, ApiStandardErrorResponses } from '../common/swagger';
import { UpdateStockThresholdParamDto } from './dto/stock-threshold.dto';
import { AnalyticsExceptionFilter } from './filters/analytics-exception.filter';

@ApiTags('analytics')
@ApiRoleHeaders()
@ApiStandardErrorResponses()
@Controller('analytics')
@UseFilters(AnalyticsExceptionFilter)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('requestor-summary')
  @ApiOperation({ summary: 'Get requestor dashboard summary' })
  @ApiOkResponse({ description: 'Requestor summary returned successfully.', type: RequestorSummaryResponseDto })
  requestorSummary(@Req() req: any) {
    return this.analyticsService.getRequestorSummary(req.context);
  }

  @Get('department-summary')
  @ApiOperation({ summary: 'Get department-head dashboard summary' })
  @ApiOkResponse({ description: 'Department summary returned successfully.', type: DepartmentSummaryResponseDto })
  departmentSummary(@Req() req: any) {
    return this.analyticsService.getDepartmentSummary(req.context);
  }

  @Get('registrar-summary')
  @ApiOperation({ summary: 'Get registrar dashboard summary' })
  @ApiOkResponse({ description: 'Registrar summary returned successfully.', type: RegistrarSummaryResponseDto })
  registrarSummary(@Req() req: any) {
    return this.analyticsService.getRegistrarSummary(req.context);
  }

  @Get('stock')
  @ApiOperation({ summary: 'Get stock threshold rows visible to the acting role' })
  @ApiOkResponse({ description: 'Stock monitoring rows returned successfully.', type: StockRowResponseDto, isArray: true })
  stock(@Req() req: any) {
    return this.analyticsService.getStock(req.context);
  }

  @Patch('stock-thresholds/:id/:level')
  @Roles('Dept Head', 'System Admin')
  @ApiOperation({ summary: 'Update a stock threshold level' })
  @ApiParam({ name: 'id', example: 'TH-1' })
  @ApiParam({ name: 'level', example: 10 })
  @ApiOkResponse({ description: 'Stock threshold updated successfully.', type: StockRowResponseDto })
  updateStockThreshold(@Param('id') id: string, @Param('level') level: string, @Req() req: any) {
    const parsed = Number(level);
    const dto: UpdateStockThresholdParamDto = { level: parsed };
    if (!Number.isInteger(dto.level) || dto.level < 0) {
      throw new BadRequestException('Threshold level must be a non-negative integer.');
    }
    return this.analyticsService.updateStockThreshold(id, dto.level, req.context);
  }
}
