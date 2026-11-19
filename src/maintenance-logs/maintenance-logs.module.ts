import { Module } from '@nestjs/common';
import { MaintenanceLogsService } from './maintenance-logs.service';
import { MaintenanceLogsController } from './maintenance-logs.controller';

@Module({
  controllers: [MaintenanceLogsController],
  providers: [MaintenanceLogsService],
  exports: [MaintenanceLogsService],
})
export class MaintenanceLogsModule {}
