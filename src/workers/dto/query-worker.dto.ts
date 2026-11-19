import { IsString, IsInt, IsOptional, IsIn } from 'class-validator';

export class QueryWorkerDto {
  @IsInt()
  @IsOptional()
  departmentId?: number;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive', 'vacation'])
  status?: string;

  @IsString()
  @IsOptional()
  search?: string; // searches by name or code
}
