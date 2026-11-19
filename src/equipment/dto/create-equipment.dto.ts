import {
  IsString, IsBoolean, IsOptional, MaxLength,
  IsInt, IsDateString,
} from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  @MaxLength(20)
  code: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsInt()
  departmentId: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  model?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  serialNumber?: string;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  status?: string = 'active'; // active / under_maintenance / retired

  @IsString()
  @IsOptional()
  notes?: string;
}
