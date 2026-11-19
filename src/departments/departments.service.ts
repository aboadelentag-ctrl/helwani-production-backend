import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    const exists = await this.prisma.department.findUnique({
      where: { code: dto.code },
    });
    if (exists) {
      throw new ConflictException(`Department with code '${dto.code}' already exists`);
    }
    return this.prisma.department.create({ data: dto });
  }

  async findAll(includeInactive = false) {
    return this.prisma.department.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        workers: { select: { id: true, code: true, name: true } },
        equipment: { select: { id: true, code: true, name: true } },
        tasks: { select: { id: true, code: true, name: true } },
      },
    });
    if (!dept) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return dept;
  }

  async update(id: number, dto: UpdateDepartmentDto) {
    await this.findOne(id);
    return this.prisma.department.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
