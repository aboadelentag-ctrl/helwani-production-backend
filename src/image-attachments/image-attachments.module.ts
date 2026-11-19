import { Module } from '@nestjs/common';
import { ImageAttachmentsService } from './image-attachments.service';
import { ImageAttachmentsController } from './image-attachments.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [ImageAttachmentsController],
  providers: [ImageAttachmentsService],
  exports: [ImageAttachmentsService],
})
export class ImageAttachmentsModule {}
