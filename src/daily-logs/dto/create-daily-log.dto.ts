import {
  IsInt, IsNumber, IsString, IsOptional, IsDateString,
  Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTaskGradeDto } from '../../task-grades/dto/create-task-grade.dto';
import { CreateImageAttachmentDto } from '../../image-attachments/dto/create-image-attachment.dto';

export class CreateDailyLogDto {
  @IsDateString()
  logDate: string;

  @IsInt()
  shiftId: number;

  @IsInt()
  workerId: number;

  @IsInt()
  taskId: number;

  @IsInt()
  @IsOptional()
  equipmentId?: number;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  quantityProduced?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  wasteQuantity?: number;

  @IsString()
  @IsOptional()
  wasteReason?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  @IsOptional()
  supervisorId?: number;

  @IsString()
  @IsOptional()
  status?: string = 'completed';

  // Nested creation
  @ValidateNested()
  @Type(() => CreateTaskGradeDto)
  @IsOptional()
  grades?: CreateTaskGradeDto;

  @ValidateNested({ each: true })
  @Type(() => CreateImageAttachmentDto)
  @IsOptional()
  images?: CreateImageAttachmentDto[];
}
