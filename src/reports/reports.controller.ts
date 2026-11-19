import {
  Controller, Get, Query, Param, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { DateRangeDto } from './dto/date-range.dto';
import { MonthlyReportDto } from './dto/monthly-report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('daily-summary')
  @ApiOperation({ summary: 'Daily production summary' })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  dailySummary(
    @Query('date') date: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.service.dailySummary(date, departmentId ? Number(departmentId) : undefined);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Monthly production report (grouped by day)' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  monthlyReport(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const dto: MonthlyReportDto = {
      year: Number(year),
      month: Number(month),
    };
    return this.service.monthlyReport(dto, departmentId ? Number(departmentId) : undefined);
  }

  @Get('worker-performance/:workerId')
  @ApiOperation({ summary: 'Worker performance report for date range' })
  workerPerformance(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.service.workerPerformance(workerId, { startDate, endDate });
  }

  @Get('department-comparison')
  @ApiOperation({ summary: 'Compare all departments over a date range' })
  departmentComparison(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.service.departmentComparison({ startDate, endDate });
  }

  @Get('waste-analysis')
  @ApiOperation({ summary: 'Waste analysis by reason and department' })
  wasteAnalysis(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.service.wasteAnalysis({ startDate, endDate });
  }

  @Get('equipment-utilization')
  @ApiOperation({ summary: 'Equipment usage and downtime over a date range' })
  equipmentUtilization(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.service.equipmentUtilization({ startDate, endDate });
  }

  @Get('maintenance-summary')
  @ApiOperation({ summary: 'Maintenance breakdowns summary' })
  maintenanceSummary(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.service.maintenanceSummary({ startDate, endDate });
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard KPIs for today' })
  dashboardKpis() {
    return this.service.dashboardKpis();
  }
}
