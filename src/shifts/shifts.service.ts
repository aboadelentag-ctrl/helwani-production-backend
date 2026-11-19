import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateShiftDto) {
    const exists = await this.prisma.shift.findUnique({ where: { code: dto.code } });
    if (exists) {
      throw new ConflictException(`Shift with code '${dto.code}' already exists`);
    }
    return this.prisma.shift.create({
      data: {
        ...dto,
        startTime: dto.startTime ?? null,
        endTime: dto.endTime ?? null,
      },
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.shift.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        attendance: { take: 50, orderBy: { attendanceDate: 'desc' } },
        dailyLogs: { take: 50, orderBy: { logDate: 'desc' } },
      },
    });
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
    return shift;
  }

  async update(id: number, dto: UpdateShiftDto) {
    await this.findOne(id);
    return this.prisma.shift.update({
      where: { id },
      data: {
        ...dto,
        startTime: dto.startTime ?? undefined,
        endTime: dto.endTime ?? undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.shift.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
