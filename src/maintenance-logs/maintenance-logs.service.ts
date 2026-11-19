import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { UpdateMaintenanceLogDto } from './dto/update-maintenance-log.dto';

@Injectable()
export class MaintenanceLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMaintenanceLogDto) {
    return this.prisma.maintenanceLog.create({
      data: {
        ...dto,
        breakdownAt: new Date(dto.breakdownAt),
        fixedAt: dto.fixedAt ? new Date(dto.fixedAt) : null,
      },
      include: { equipment: { select: { id: true, code: true, name: true } } },
    });
  }

  async findAll(equipmentId?: number, startDate?: string, endDate?: string) {
    const where: any = {};
    if (equipmentId) where.equipmentId = equipmentId;
    if (startDate || endDate) {
      where.breakdownAt = {};
      if (startDate) where.breakdownAt.gte = new Date(startDate);
      if (endDate) where.breakdownAt.lte = new Date(endDate);
    }
    return this.prisma.maintenanceLog.findMany({
      where,
      include: {
        equipment: { select: { id: true, code: true, name: true, department: { select: { name: true } } } },
      },
      orderBy: { breakdownAt: 'desc' },
    });
  }

  async findOpenIssues() {
    return this.prisma.maintenanceLog.findMany({
      where: { fixedAt: null },
      include: { equipment: { select: { id: true, code: true, name: true } } },
      orderBy: { breakdownAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const log = await this.prisma.maintenanceLog.findUnique({
      where: { id },
      include: { equipment: true },
    });
    if (!log) throw new NotFoundException(`Maintenance log ${id} not found`);
    return log;
  }

  async update(id: number, dto: UpdateMaintenanceLogDto) {
    await this.findOne(id);
    return this.prisma.maintenanceLog.update({
      where: { id },
      data: {
        ...dto,
        breakdownAt: dto.breakdownAt ? new Date(dto.breakdownAt) : undefined,
        fixedAt: dto.fixedAt ? new Date(dto.fixedAt) : undefined,
      },
      include: { equipment: { select: { id: true, name: true } } },
    });
  }

  async resolve(id: number, fixedAt: string, technician?: string) {
    await this.findOne(id);
    return this.prisma.maintenanceLog.update({
      where: { id },
      data: {
        fixedAt: new Date(fixedAt),
        technician: technician ?? undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.maintenanceLog.delete({ where: { id } });
  }
}
