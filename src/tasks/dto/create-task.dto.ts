import {
  IsString, IsBoolean, IsOptional, MaxLength,
  IsInt, IsNumber, Min,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MaxLength(30)
  code: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsInt()
  departmentId: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  expectedTimeMinutes?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  standardQuantity?: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  unit?: string; // piece, kg, tray

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
