import {
  IsString, IsBoolean, IsOptional, MaxLength,
  IsInt, IsDateString, IsIn,
} from 'class-validator';

export class CreateWorkerDto {
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
  jobTitle?: string;

  @IsDateString()
  @IsOptional()
  hireDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive', 'vacation'])
  status?: string = 'active';
}
