import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { QueryWorkerDto } from './dto/query-worker.dto';

@Injectable()
export class WorkersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkerDto) {
    const exists = await this.prisma.worker.findUnique({ where: { code: dto.code } });
    if (exists) {
      throw new ConflictException(`Worker with code '${dto.code}' already exists`);
    }
    return this.prisma.worker.create({
      data: {
        ...dto,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : null,
      },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async findAll(query: QueryWorkerDto = {}) {
    const where: any = {};
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.worker.findMany({
      where,
      include: {
        department: { select: { id: true, code: true, name: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findByDepartment(departmentId: number) {
    return this.prisma.worker.findMany({
      where: { departmentId, status: 'active' },
      include: {
        department: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const worker = await this.prisma.worker.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, code: true, name: true } },
        attendance: {
          take: 30,
          orderBy: { attendanceDate: 'desc' },
        },
        dailyLogs: {
          take: 30,
          orderBy: { logDate: 'desc' },
          include: { task: true, equipment: true, shift: true },
        },
      },
    });
    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }
    return worker;
  }

  async update(id: number, dto: UpdateWorkerDto) {
    await this.findOne(id);
    return this.prisma.worker.update({
      where: { id },
      data: {
        ...dto,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
      },
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.worker.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }
}
