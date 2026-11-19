import { IsDateString, IsOptional, IsInt } from 'class-validator';

export class DateRangeDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @IsOptional()
  departmentId?: number;
}
