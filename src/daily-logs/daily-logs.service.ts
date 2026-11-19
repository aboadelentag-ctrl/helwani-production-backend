import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';
import { UpdateDailyLogDto } from './dto/update-daily-log.dto';
import { QueryDailyLogDto } from './dto/query-daily-log.dto';

@Injectable()
export class DailyLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDailyLogDto) {
    const { grades, images, ...logData } = dto;
    return this.prisma.dailyLog.create({
      data: {
        ...logData,
        logDate: new Date(logData.logDate),
        startTime: logData.startTime ? new Date(logData.startTime) : null,
        endTime: logData.endTime ? new Date(logData.endTime) : null,
        durationMinutes: this.calcDuration(logData.startTime, logData.endTime),
        ...(grades && {
          grades: {
            create: {
              ...grades,
              totalScore:
                grades.qualityScore +
                grades.speedScore +
                grades.cleanlinessScore +
                grades.recipeScore,
            },
          },
        }),
        ...(images &&
          images.length > 0 && {
            images: {
              create: images.map(({ dailyLogId, ...img }) => img),
            },
          }),
      },
      include: {
        worker: { select: { id: true, code: true, name: true } },
        task: { select: { id: true, code: true, name: true } },
        equipment: { select: { id: true, code: true, name: true } },
        shift: { select: { id: true, code: true, name: true } },
        grades: true,
        images: true,
      },
    });
  }

  private calcDuration(start?: string, end?: string): number | null {
    if (!start || !end) return null;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.round(ms / 60000);
  }

  async findAll(query: QueryDailyLogDto) {
    const where: any = {};
    if (query.date) where.logDate = new Date(query.date);
    if (query.startDate || query.endDate) {
      where.logDate = {};
      if (query.startDate) where.logDate.gte = new Date(query.startDate);
      if (query.endDate) where.logDate.lte = new Date(query.endDate);
    }
    if (query.workerId) where.workerId = query.workerId;
    if (query.workerSearch) {
      where.worker = {
        OR: [
          { name: { contains: query.workerSearch, mode: 'insensitive' } },
          { code: { contains: query.workerSearch, mode: 'insensitive' } },
        ],
      };
    }
    if (query.taskId) where.taskId = query.taskId;
    if (query.equipmentId) where.equipmentId = query.equipmentId;
    if (query.shiftId) where.shiftId = query.shiftId;
    if (query.status) where.status = query.status;
    if (query.departmentId) where.task = { departmentId: query.departmentId };

    return this.prisma.dailyLog.findMany({
      where,
      include: {
        worker: { select: { id: true, code: true, name: true, department: { select: { name: true } } } },
        task: { select: { id: true, code: true, name: true } },
        equipment: { select: { id: true, code: true, name: true } },
        shift: { select: { id: true, code: true, name: true } },
        grades: true,
        images: { select: { id: true, imageUrl: true, imageType: true } },
      },
      orderBy: { logDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const log = await this.prisma.dailyLog.findUnique({
      where: { id },
      include: {
        worker: { include: { department: true } },
        task: true,
        equipment: true,
        shift: true,
        grades: true,
        images: true,
      },
    });
    if (!log) throw new NotFoundException(`Daily log ${id} not found`);
    return log;
  }

  async update(id: number, dto: UpdateDailyLogDto) {
    const { grades, images, ...logData } = dto;
    await this.findOne(id);

    return this.prisma.dailyLog.update({
      where: { id },
      data: {
        ...logData,
        logDate: logData.logDate ? new Date(logData.logDate) : undefined,
        startTime: logData.startTime ? new Date(logData.startTime) : undefined,
        endTime: logData.endTime ? new Date(logData.endTime) : undefined,
        durationMinutes:
          logData.startTime || logData.endTime
            ? this.calcDuration(
                logData.startTime ?? undefined,
                logData.endTime ?? undefined,
              ) ?? undefined
            : undefined,
        ...(grades && {
          grades: {
            upsert: {
              create: {
                ...grades,
                totalScore:
                  grades.qualityScore +
                  grades.speedScore +
                  grades.cleanlinessScore +
                  grades.recipeScore,
              },
              update: {
                ...grades,
                totalScore:
                  grades.qualityScore +
                  grades.speedScore +
                  grades.cleanlinessScore +
                  grades.recipeScore,
              },
            },
          },
        }),
        ...(images &&
          images.length > 0 && {
            images: {
              create: images.map(({ dailyLogId, ...img }) => img),
            },
          }),
      },
      include: {
        worker: true, task: true, equipment: true, shift: true, grades: true, images: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.dailyLog.delete({ where: { id } });
  }

  async getDailySummary(date: string, departmentId?: number) {
    const day = new Date(date);
    const where: any = { logDate: day };
    if (departmentId) where.task = { departmentId };

    const logs = await this.prisma.dailyLog.findMany({
      where,
      include: { grades: true },
    });

    const totalLogs = logs.length;
    const totalProduced = logs.reduce(
      (sum, l) => sum + (l.quantityProduced ? Number(l.quantityProduced) : 0),
      0,
    );
    const totalWaste = logs.reduce(
      (sum, l) => sum + (l.wasteQuantity ? Number(l.wasteQuantity) : 0),
      0,
    );
    const gradedLogs = logs.filter((l) => l.grades);
    const avgTotalScore = gradedLogs.length
      ? gradedLogs.reduce((s, l) => s + (l.grades?.totalScore ?? 0), 0) / gradedLogs.length
      : 0;

    return {
      date,
      departmentId: departmentId ?? 'all',
      totalLogs,
      totalProduced,
      totalWaste,
      wastePercentage: totalProduced > 0 ? (totalWaste / totalProduced) * 100 : 0,
      avgGradeOutOf40: Number(avgTotalScore.toFixed(2)),
      gradedCount: gradedLogs.length,
    };
  }
}
