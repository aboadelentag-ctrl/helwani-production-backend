import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { DailyLogsService } from './daily-logs.service';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';
import { UpdateDailyLogDto } from './dto/update-daily-log.dto';
import { QueryDailyLogDto } from './dto/query-daily-log.dto';

@ApiTags('Daily Logs')
@ApiBearerAuth()
@Controller('daily-logs')
export class DailyLogsController {
  constructor(private readonly service: DailyLogsService) {}

  @Post()
  @ApiOperation({ summary: 'Create daily log (with optional grades and images)' })
  create(@Body() dto: CreateDailyLogDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get daily logs (with filters)' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'workerId', required: false, type: Number })
  @ApiQuery({ name: 'taskId', required: false, type: Number })
  @ApiQuery({ name: 'equipmentId', required: false, type: Number })
  @ApiQuery({ name: 'shiftId', required: false, type: Number })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'workerSearch', required: false, type: String })
  findAll(@Query() query: QueryDailyLogDto) {
    return this.service.findAll(query);
  }

  @Get('summary/daily')
  @ApiOperation({ summary: 'Get daily summary (production, waste, grades)' })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  getDailySummary(
    @Query('date') date: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.service.getDailySummary(date, departmentId ? Number(departmentId) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get daily log by ID (full details)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update daily log' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDailyLogDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete daily log' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
