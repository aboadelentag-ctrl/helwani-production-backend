import {
  IsString, IsOptional, MaxLength, IsInt,
  IsDateString, IsNumber, Min,
} from 'class-validator';

export class CreateMaintenanceLogDto {
  @IsInt()
  equipmentId: number;

  @IsDateString()
  breakdownAt: string;

  @IsDateString()
  @IsOptional()
  fixedAt?: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  cost?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  technician?: string;
}
