import {
  IsInt, IsString, IsOptional, IsDateString,
} from 'class-validator';

export class CreateAttendanceDto {
  @IsInt()
  workerId: number;

  @IsDateString()
  attendanceDate: string;

  @IsInt()
  shiftId: number;

  @IsDateString()
  @IsOptional()
  checkIn?: string;

  @IsDateString()
  @IsOptional()
  checkOut?: string;

  @IsString()
  @IsOptional()
  status?: string = 'present'; // present / absent / late / half-day / vacation

  @IsString()
  @IsOptional()
  notes?: string;
}
