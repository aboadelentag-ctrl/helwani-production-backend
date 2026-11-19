import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { DepartmentsModule } from './departments/departments.module';
import { ShiftsModule } from './shifts/shifts.module';
import { WorkersModule } from './workers/workers.module';
import { EquipmentModule } from './equipment/equipment.module';
import { TasksModule } from './tasks/tasks.module';
import { MaintenanceLogsModule } from './maintenance-logs/maintenance-logs.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ImageAttachmentsModule } from './image-attachments/image-attachments.module';
import { DailyLogsModule } from './daily-logs/daily-logs.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CloudinaryModule,
    DepartmentsModule,
    ShiftsModule,
    WorkersModule,
    EquipmentModule,
    TasksModule,
    MaintenanceLogsModule,
    AttendanceModule,
    ImageAttachmentsModule,
    DailyLogsModule,
    ReportsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
