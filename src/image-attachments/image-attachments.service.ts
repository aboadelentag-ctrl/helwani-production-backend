import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImageAttachmentDto } from './dto/create-image-attachment.dto';
import { UpdateImageAttachmentDto } from './dto/update-image-attachment.dto';

@Injectable()
export class ImageAttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateImageAttachmentDto) {
    return this.prisma.imageAttachment.create({
      data: dto,
      include: { dailyLog: { select: { id: true } } },
    });
  }

  async findByDailyLog(dailyLogId: number) {
    return this.prisma.imageAttachment.findMany({
      where: { dailyLogId },
      orderBy: { uploadedAt: 'asc' },
    });
  }

  async findOne(id: number) {
    const img = await this.prisma.imageAttachment.findUnique({ where: { id } });
    if (!img) throw new NotFoundException(`Image ${id} not found`);
    return img;
  }

  async update(id: number, dto: UpdateImageAttachmentDto) {
    await this.findOne(id);
    return this.prisma.imageAttachment.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.imageAttachment.delete({ where: { id } });
  }
}
