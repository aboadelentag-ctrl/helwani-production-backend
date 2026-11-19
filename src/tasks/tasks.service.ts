import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto) {
    const exists = await this.prisma.task.findUnique({ where: { code: dto.code } });
    if (exists) {
      throw new ConflictException(`Task with code '${dto.code}' already exists`);
    }
    return this.prisma.task.create({
      data: dto,
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async findAll(departmentId?: number, includeInactive = false) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (!includeInactive) where.isActive = true;
    return this.prisma.task.findMany({
      where,
      include: {
        department: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ departmentId: 'asc' }, { id: 'asc' }],
    });
  }

  async findByDepartment(departmentId: number, includeInactive = false) {
    return this.prisma.task.findMany({
      where: {
        departmentId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, code: true, name: true } },
        dailyLogs: {
          take: 20,
          orderBy: { logDate: 'desc' },
        },
      },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: number, dto: UpdateTaskDto) {
    await this.findOne(id);
    return this.prisma.task.update({
      where: { id },
      data: dto,
      include: { department: { select: { id: true, name: true } } },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.task.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
