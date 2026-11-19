import { PartialType } from '@nestjs/swagger';
import { CreateTaskGradeDto } from './create-task-grade.dto';

export class UpdateTaskGradeDto extends PartialType(CreateTaskGradeDto) {}
