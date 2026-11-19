import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateTaskGradeDto {
  @IsInt()
  @Min(0)
  @Max(10)
  qualityScore: number;

  @IsInt()
  @Min(0)
  @Max(10)
  speedScore: number;

  @IsInt()
  @Min(0)
  @Max(10)
  cleanlinessScore: number;

  @IsInt()
  @Min(0)
  @Max(10)
  recipeScore: number;

  @IsInt()
  @IsOptional()
  gradedById?: number;
}
