import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Equipment')
@ApiBearerAuth()
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly service: EquipmentService) {}

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create new equipment' })
  create(@Body() dto: CreateEquipmentDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all equipment (with optional filters)' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(
      departmentId ? Number(departmentId) : undefined,
      status,
    );
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'Get all active equipment in a department' })
  findByDepartment(@Param('departmentId', ParseIntPipe) departmentId: number) {
    return this.service.findByDepartment(departmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get equipment by ID (with maintenance history)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update equipment' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEquipmentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retire equipment (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
