import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MaintenanceLogsService } from './maintenance-logs.service';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { UpdateMaintenanceLogDto } from './dto/update-maintenance-log.dto';

@ApiTags('Maintenance Logs')
@ApiBearerAuth()
@Controller('maintenance-logs')
export class MaintenanceLogsController {
  constructor(private readonly service: MaintenanceLogsService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new equipment breakdown' })
  create(@Body() dto: CreateMaintenanceLogDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get maintenance logs (with optional filters)' })
  @ApiQuery({ name: 'equipmentId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  findAll(
    @Query('equipmentId') equipmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findAll(
      equipmentId ? Number(equipmentId) : undefined,
      startDate,
      endDate,
    );
  }

  @Get('open')
  @ApiOperation({ summary: 'Get all unresolved breakdowns' })
  findOpenIssues() {
    return this.service.findOpenIssues();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get maintenance log by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update maintenance log' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMaintenanceLogDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Mark breakdown as resolved' })
  resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { fixedAt: string; technician?: string },
  ) {
    return this.service.resolve(id, body.fixedAt, body.technician);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete maintenance log' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
