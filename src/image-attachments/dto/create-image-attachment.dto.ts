import { IsString, IsOptional, MaxLength, IsInt } from 'class-validator';

export class CreateImageAttachmentDto {
  @IsString()
  imageUrl: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  imageType?: string; // before / after / defect / result

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  uploadedById?: number;

  @IsInt()
  @IsOptional()
  dailyLogId?: number;
}
