import { IsInt, IsString, IsOptional, IsDateString } from 'class-validator';

export class QueryDailyLogDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @IsOptional()
  workerId?: number;

  @IsInt()
  @IsOptional()
  taskId?: number;

  @IsInt()
  @IsOptional()
  equipmentId?: number;

  @IsInt()
  @IsOptional()
  shiftId?: number;

  @IsInt()
  @IsOptional()
  departmentId?: number; // via task

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  workerSearch?: string;
}
