import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeDto } from './dto/date-range.dto';
import { MonthlyReportDto } from './dto/monthly-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Daily Summary (used for dashboard)
  async dailySummary(date: string, departmentId?: number) {
    const day = new Date(date);
    const where: any = { logDate: day };
    if (departmentId) where.task = { departmentId };

    const logs = await this.prisma.dailyLog.findMany({
      where,
      include: { grades: true, task: { select: { department: { select: { name: true } } } } },
    });

    const totalLogs = logs.length;
    const totalProduced = logs.reduce((s, l) => s + (l.quantityProduced ? Number(l.quantityProduced) : 0), 0);
    const totalWaste = logs.reduce((s, l) => s + (l.wasteQuantity ? Number(l.wasteQuantity) : 0), 0);
    const gradedLogs = logs.filter((l) => l.grades);
    const avgGrade = gradedLogs.length
      ? gradedLogs.reduce((s, l) => s + (l.grades?.totalScore ?? 0), 0) / gradedLogs.length
      : 0;

    return {
      date,
      departmentId: departmentId ?? 'all',
      totalLogs,
      totalProduced,
      totalWaste,
      wastePercentage: totalProduced > 0 ? Number(((totalWaste / totalProduced) * 100).toFixed(2)) : 0,
      avgGradeOutOf40: Number(avgGrade.toFixed(2)),
      gradedCount: gradedLogs.length,
    };
  }

  // 2. Monthly Report (grouped by day)
  async monthlyReport(dto: MonthlyReportDto, departmentId?: number) {
    const startDate = new Date(dto.year, dto.month - 1, 1);
    const endDate = new Date(dto.year, dto.month, 0, 23, 59, 59);

    const where: any = {
      logDate: { gte: startDate, lte: endDate },
    };
    if (departmentId) where.task = { departmentId };

    const logs = await this.prisma.dailyLog.findMany({
      where,
      include: { grades: true, task: { select: { department: { select: { name: true } } } } },
    });

    // Group by day
    const byDay: Record<string, any> = {};
    logs.forEach((l) => {
      const day = l.logDate.toISOString().split('T')[0];
      if (!byDay[day]) {
        byDay[day] = {
          date: day,
          totalLogs: 0,
          totalProduced: 0,
          totalWaste: 0,
          gradedCount: 0,
          gradeSum: 0,
        };
      }
      byDay[day].totalLogs += 1;
      byDay[day].totalProduced += l.quantityProduced ? Number(l.quantityProduced) : 0;
      byDay[day].totalWaste += l.wasteQuantity ? Number(l.wasteQuantity) : 0;
      if (l.grades) {
        byDay[day].gradedCount += 1;
        byDay[day].gradeSum += l.grades.totalScore;
      }
    });

    const dailyBreakdown = Object.values(byDay).map((d: any) => ({
      ...d,
      avgGrade: d.gradedCount ? Number((d.gradeSum / d.gradedCount).toFixed(2)) : 0,
    }));

    const totalLogs = logs.length;
    const totalProduced = logs.reduce((s, l) => s + (l.quantityProduced ? Number(l.quantityProduced) : 0), 0);
    const totalWaste = logs.reduce((s, l) => s + (l.wasteQuantity ? Number(l.wasteQuantity) : 0), 0);
    const gradedLogs = logs.filter((l) => l.grades);
    const avgGrade = gradedLogs.length
      ? gradedLogs.reduce((s, l) => s + (l.grades?.totalScore ?? 0), 0) / gradedLogs.length
      : 0;

    return {
      period: `${dto.year}-${String(dto.month).padStart(2, '0')}`,
      departmentId: departmentId ?? 'all',
      summary: {
        totalLogs,
        totalProduced,
        totalWaste,
        wastePercentage: totalProduced > 0 ? Number(((totalWaste / totalProduced) * 100).toFixed(2)) : 0,
        avgGradeOutOf40: Number(avgGrade.toFixed(2)),
        activeDays: dailyBreakdown.length,
      },
      dailyBreakdown,
    };
  }

  // 3. Worker Performance Report
  async workerPerformance(workerId: number, dto: DateRangeDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const logs = await this.prisma.dailyLog.findMany({
      where: {
        workerId,
        logDate: { gte: startDate, lte: endDate },
      },
      include: {
        task: { select: { id: true, code: true, name: true } },
        grades: true,
      },
      orderBy: { logDate: 'desc' },
    });

    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      include: { department: { select: { name: true } } },
    });

    if (!worker) {
      throw new NotFoundException(`Worker ${workerId} not found`);
    }

    const totalLogs = logs.length;
    const totalProduced = logs.reduce((s, l) => s + (l.quantityProduced ? Number(l.quantityProduced) : 0), 0);
    const totalWaste = logs.reduce((s, l) => s + (l.wasteQuantity ? Number(l.wasteQuantity) : 0), 0);
    const gradedLogs = logs.filter((l) => l.grades);

    const avgQuality = gradedLogs.length ? gradedLogs.reduce((s, l) => s + (l.grades?.qualityScore ?? 0), 0) / gradedLogs.length : 0;
    const avgSpeed = gradedLogs.length ? gradedLogs.reduce((s, l) => s + (l.grades?.speedScore ?? 0), 0) / gradedLogs.length : 0;
    const avgCleanliness = gradedLogs.length ? gradedLogs.reduce((s, l) => s + (l.grades?.cleanlinessScore ?? 0), 0) / gradedLogs.length : 0;
    const avgRecipe = gradedLogs.length ? gradedLogs.reduce((s, l) => s + (l.grades?.recipeScore ?? 0), 0) / gradedLogs.length : 0;

    // Top tasks (by frequency)
    const taskCount: Record<string, { task: any; count: number; avgGrade: number; gradeSum: number }> = {};
    logs.forEach((l) => {
      if (!l.task) return;
      const key = l.task.code;
      if (!taskCount[key]) {
        taskCount[key] = { task: l.task, count: 0, avgGrade: 0, gradeSum: 0 };
      }
      taskCount[key].count += 1;
      if (l.grades?.totalScore != null) {
        taskCount[key].gradeSum += l.grades.totalScore;
      }
    });
    const topTasks = Object.values(taskCount)
      .map((t) => ({
        task: t.task,
        count: t.count,
        avgGrade: t.count > 0 && t.gradeSum > 0 ? Number((t.gradeSum / t.count).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Attendance in the period
    const attendance = await this.prisma.attendance.findMany({
      where: {
        workerId,
        attendanceDate: { gte: startDate, lte: endDate },
      },
      select: { status: true },
    });
    const attendanceRate = attendance.length > 0
      ? Number(((attendance.filter((a) => a.status === 'present').length / attendance.length) * 100).toFixed(2))
      : 0;

    return {
      worker: {
        id: worker.id,
        code: worker.code,
        name: worker.name,
        department: worker.department?.name,
      },
      period: { startDate: dto.startDate, endDate: dto.endDate },
      summary: {
        totalLogs,
        totalProduced,
        totalWaste,
        wastePercentage: totalProduced > 0 ? Number(((totalWaste / totalProduced) * 100).toFixed(2)) : 0,
        attendanceRate,
        avgScores: {
          quality: Number(avgQuality.toFixed(2)),
          speed: Number(avgSpeed.toFixed(2)),
          cleanliness: Number(avgCleanliness.toFixed(2)),
          recipe: Number(avgRecipe.toFixed(2)),
          total: Number(((avgQuality + avgSpeed + avgCleanliness + avgRecipe)).toFixed(2)),
        },
      },
      topTasks,
      recentLogs: logs.slice(0, 10),
    };
  }

  // 4. Department Comparison
  async departmentComparison(dto: DateRangeDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
    });

    const result = [];
    for (const dept of departments) {
      const logs = await this.prisma.dailyLog.findMany({
        where: {
          task: { departmentId: dept.id },
          logDate: { gte: startDate, lte: endDate },
        },
        include: { grades: true },
      });

      const totalLogs = logs.length;
      const totalProduced = logs.reduce((s, l) => s + (l.quantityProduced ? Number(l.quantityProduced) : 0), 0);
      const totalWaste = logs.reduce((s, l) => s + (l.wasteQuantity ? Number(l.wasteQuantity) : 0), 0);
      const gradedLogs = logs.filter((l) => l.grades);
      const avgGrade = gradedLogs.length
        ? gradedLogs.reduce((s, l) => s + (l.grades?.totalScore ?? 0), 0) / gradedLogs.length
        : 0;

      result.push({
        department: dept,
        totalLogs,
        totalProduced,
        totalWaste,
        wastePercentage: totalProduced > 0 ? Number(((totalWaste / totalProduced) * 100).toFixed(2)) : 0,
        avgGradeOutOf40: Number(avgGrade.toFixed(2)),
        gradedCount: gradedLogs.length,
      });
    }

    // Sort by total produced desc
    return result.sort((a, b) => b.totalProduced - a.totalProduced);
  }

  // 5. Waste Analysis
  async wasteAnalysis(dto: DateRangeDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const logs = await this.prisma.dailyLog.findMany({
      where: {
        logDate: { gte: startDate, lte: endDate },
        wasteQuantity: { gt: 0 },
      },
      include: {
        task: { select: { department: { select: { id: true, name: true } } } },
      },
    });

    const totalWaste = logs.reduce((s, l) => s + (l.wasteQuantity ? Number(l.wasteQuantity) : 0), 0);
    const totalProduced = logs.reduce((s, l) => s + (l.quantityProduced ? Number(l.quantityProduced) : 0), 0);

    // By reason
    const byReason: Record<string, { reason: string; count: number; totalWaste: number }> = {};
    logs.forEach((l) => {
      const reason = l.wasteReason || 'غير محدد';
      if (!byReason[reason]) byReason[reason] = { reason, count: 0, totalWaste: 0 };
      byReason[reason].count += 1;
      byReason[reason].totalWaste += l.wasteQuantity ? Number(l.wasteQuantity) : 0;
    });

    // By department
    const byDept: Record<string, { department: string; count: number; totalWaste: number }> = {};
    logs.forEach((l) => {
      const dept = l.task?.department?.name || 'غير محدد';
      if (!byDept[dept]) byDept[dept] = { department: dept, count: 0, totalWaste: 0 };
      byDept[dept].count += 1;
      byDept[dept].totalWaste += l.wasteQuantity ? Number(l.wasteQuantity) : 0;
    });

    return {
      period: { startDate: dto.startDate, endDate: dto.endDate },
      summary: {
        totalWaste,
        totalProduced,
        wastePercentage: totalProduced > 0 ? Number(((totalWaste / totalProduced) * 100).toFixed(2)) : 0,
        wasteIncidentsCount: logs.length,
      },
      byReason: Object.values(byReason).sort((a, b) => b.totalWaste - a.totalWaste),
      byDepartment: Object.values(byDept).sort((a, b) => b.totalWaste - a.totalWaste),
    };
  }

  // 6. Equipment Utilization
  async equipmentUtilization(dto: DateRangeDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const equipment = await this.prisma.equipment.findMany({
      where: { status: 'active' },
      select: { id: true, code: true, name: true, department: { select: { name: true } } },
    });

    const result = [];
    for (const eq of equipment) {
      const logs = await this.prisma.dailyLog.findMany({
        where: {
          equipmentId: eq.id,
          logDate: { gte: startDate, lte: endDate },
        },
        select: { durationMinutes: true, logDate: true },
      });

      const totalMinutes = logs.reduce((s, l) => s + (l.durationMinutes ?? 0), 0);
      const totalHours = Number((totalMinutes / 60).toFixed(2));

      const breakdowns = await this.prisma.maintenanceLog.findMany({
        where: {
          equipmentId: eq.id,
          breakdownAt: { gte: startDate, lte: endDate },
        },
        select: { breakdownAt: true, fixedAt: true },
      });

      const downtimeMinutes = breakdowns.reduce((s, b) => {
        if (b.fixedAt) {
          return s + Math.round((b.fixedAt.getTime() - b.breakdownAt.getTime()) / 60000);
        }
        return s + 0; // open issue, no downtime counted yet
      }, 0);

      result.push({
        equipment: eq,
        usageCount: logs.length,
        totalHoursUsed: totalHours,
        breakdownsCount: breakdowns.length,
        downtimeHours: Number((downtimeMinutes / 60).toFixed(2)),
        openIssues: breakdowns.filter((b) => !b.fixedAt).length,
      });
    }

    return result.sort((a, b) => b.totalHoursUsed - a.totalHoursUsed);
  }

  // 7. Maintenance Summary
  async maintenanceSummary(dto: DateRangeDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const logs = await this.prisma.maintenanceLog.findMany({
      where: {
        breakdownAt: { gte: startDate, lte: endDate },
      },
      include: {
        equipment: { select: { id: true, code: true, name: true, department: { select: { name: true } } } },
      },
      orderBy: { breakdownAt: 'desc' },
    });

    const totalBreakdowns = logs.length;
    const resolvedBreakdowns = logs.filter((l) => l.fixedAt).length;
    const openBreakdowns = logs.filter((l) => !l.fixedAt).length;
    const totalCost = logs.reduce((s, l) => s + (l.cost ? Number(l.cost) : 0), 0);

    const downtimeMinutes = logs.reduce((s, l) => {
      if (l.fixedAt) {
        return s + Math.round((l.fixedAt.getTime() - l.breakdownAt.getTime()) / 60000);
      }
      const now = new Date();
      return s + Math.round((now.getTime() - l.breakdownAt.getTime()) / 60000);
    }, 0);

    // By equipment
    const byEquipment: Record<string, any> = {};
    logs.forEach((l) => {
      const key = l.equipment?.code || 'unknown';
      if (!byEquipment[key]) {
        byEquipment[key] = {
          equipment: l.equipment,
          count: 0,
          totalCost: 0,
        };
      }
      byEquipment[key].count += 1;
      byEquipment[key].totalCost += l.cost ? Number(l.cost) : 0;
    });

    return {
      period: { startDate: dto.startDate, endDate: dto.endDate },
      summary: {
        totalBreakdowns,
        resolvedBreakdowns,
        openBreakdowns,
        totalCost: Number(totalCost.toFixed(2)),
        totalDowntimeHours: Number((downtimeMinutes / 60).toFixed(2)),
      },
      byEquipment: Object.values(byEquipment).sort((a: any, b: any) => b.count - a.count),
      recentBreakdowns: logs.slice(0, 10),
    };
  }

  // 8. Dashboard KPIs (today)
  async dashboardKpis() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Today's production
    const todayLogs = await this.prisma.dailyLog.findMany({
      where: { logDate: today },
      include: { grades: true },
    });

    const totalProduced = todayLogs.reduce((s, l) => s + (l.quantityProduced ? Number(l.quantityProduced) : 0), 0);
    const totalWaste = todayLogs.reduce((s, l) => s + (l.wasteQuantity ? Number(l.wasteQuantity) : 0), 0);
    const gradedLogs = todayLogs.filter((l) => l.grades);
    const avgGrade = gradedLogs.length
      ? gradedLogs.reduce((s, l) => s + (l.grades?.totalScore ?? 0), 0) / gradedLogs.length
      : 0;

    // Open maintenance issues
    const openIssues = await this.prisma.maintenanceLog.count({
      where: { fixedAt: null },
    });

    // Active workers today
    const activeWorkersToday = await this.prisma.attendance.count({
      where: { attendanceDate: today, status: 'present' },
    });

    // Total workers
    const totalWorkers = await this.prisma.worker.count({ where: { status: 'active' } });

    return {
      date: todayStr,
      production: {
        totalLogsToday: todayLogs.length,
        totalProducedToday: totalProduced,
        totalWasteToday: totalWaste,
        wastePercentageToday: totalProduced > 0 ? Number(((totalWaste / totalProduced) * 100).toFixed(2)) : 0,
        avgGradeToday: Number(avgGrade.toFixed(2)),
      },
      operations: {
        activeWorkersToday,
        totalWorkers,
        attendanceRateToday: totalWorkers > 0 ? Number(((activeWorkersToday / totalWorkers) * 100).toFixed(2)) : 0,
      },
      maintenance: {
        openIssues,
      },
    };
  }
}
