import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateShiftDto {
  @IsString()
  @MaxLength(20)
  code: string;

  @IsString()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  startTime?: string; // Format: HH:mm:ss

  @IsString()
  @IsOptional()
  endTime?: string; // Format: HH:mm:ss

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
