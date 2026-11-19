import { PartialType } from '@nestjs/swagger';
import { CreateImageAttachmentDto } from './create-image-attachment.dto';

export class UpdateImageAttachmentDto extends PartialType(CreateImageAttachmentDto) {}
