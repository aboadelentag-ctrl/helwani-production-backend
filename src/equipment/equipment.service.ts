import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEquipmentDto) {
    const exists = await this.prisma.equipment.findUnique({ where: { code: dto.code } });
    if (exists) {
      throw new ConflictException(`Equipment with code '${dto.code}' already exists`);
    }
    return this.prisma.equipment.create({
      data: {
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
      },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async findAll(departmentId?: number, status?: string) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    return this.prisma.equipment.findMany({
      where,
      include: {
        department: { select: { id: true, code: true, name: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findByDepartment(departmentId: number) {
    return this.prisma.equipment.findMany({
      where: { departmentId, status: 'active' },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, code: true, name: true } },
        maintenanceLogs: { orderBy: { breakdownAt: 'desc' }, take: 20 },
        dailyLogs: { take: 20, orderBy: { logDate: 'desc' } },
      },
    });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }
    return equipment;
  }

  async update(id: number, dto: UpdateEquipmentDto) {
    await this.findOne(id);
    return this.prisma.equipment.update({
      where: { id },
      data: {
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.equipment.update({
      where: { id },
      data: { status: 'retired' },
    });
  }
}
