import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { WorkersService } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { QueryWorkerDto } from './dto/query-worker.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Workers')
@ApiBearerAuth()
@Controller('workers')
export class WorkersController {
  constructor(private readonly service: WorkersService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new worker' })
  create(@Body() dto: CreateWorkerDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workers (with optional filters)' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'vacation'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(@Query() query: QueryWorkerDto) {
    return this.service.findAll(query);
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'Get all active workers in a department' })
  findByDepartment(@Param('departmentId', ParseIntPipe) departmentId: number) {
    return this.service.findByDepartment(departmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get worker by ID (with full details)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update worker' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkerDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate worker (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
