import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkCreateAttendanceDto } from './dto/bulk-create-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAttendanceDto) {
    return this.prisma.attendance.create({
      data: {
        ...dto,
        attendanceDate: new Date(dto.attendanceDate),
        checkIn: dto.checkIn ? new Date(dto.checkIn) : null,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
      },
      include: {
        worker: { select: { id: true, code: true, name: true } },
        shift: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async bulkCreate(dto: BulkCreateAttendanceDto) {
    const result = await this.prisma.$transaction(
      dto.records.map((r) =>
        this.prisma.attendance.create({
          data: {
            workerId: r.workerId,
            shiftId: r.shiftId,
            attendanceDate: new Date(r.attendanceDate),
            checkIn: r.checkIn ? new Date(r.checkIn) : null,
            checkOut: r.checkOut ? new Date(r.checkOut) : null,
            status: r.status ?? 'present',
            notes: r.notes ?? null,
          },
        }),
      ),
    );
    return { created: result.length, records: result };
  }

  async findAll(filters: {
    workerId?: number;
    shiftId?: number;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const where: any = {};
    if (filters.workerId) where.workerId = filters.workerId;
    if (filters.shiftId) where.shiftId = filters.shiftId;
    if (filters.status) where.status = filters.status;
    if (filters.date) {
      const d = new Date(filters.date);
      where.attendanceDate = d;
    } else if (filters.startDate || filters.endDate) {
      where.attendanceDate = {};
      if (filters.startDate) where.attendanceDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.attendanceDate.lte = new Date(filters.endDate);
    }
    return this.prisma.attendance.findMany({
      where,
      include: {
        worker: { select: { id: true, code: true, name: true, department: { select: { name: true } } } },
        shift: { select: { id: true, code: true, name: true } },
      },
      orderBy: { attendanceDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const att = await this.prisma.attendance.findUnique({
      where: { id },
      include: { worker: true, shift: true },
    });
    if (!att) throw new NotFoundException(`Attendance record ${id} not found`);
    return att;
  }

  async update(id: number, dto: UpdateAttendanceDto) {
    await this.findOne(id);
    return this.prisma.attendance.update({
      where: { id },
      data: {
        ...dto,
        attendanceDate: dto.attendanceDate ? new Date(dto.attendanceDate) : undefined,
        checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
      },
    });
  }

  async checkOut(id: number, checkOut: string) {
    await this.findOne(id);
    return this.prisma.attendance.update({
      where: { id },
      data: { checkOut: new Date(checkOut) },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.attendance.delete({ where: { id } });
  }
}
