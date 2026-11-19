import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, ParseIntPipe, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ImageAttachmentsService } from './image-attachments.service';
import { CreateImageAttachmentDto } from './dto/create-image-attachment.dto';
import { UpdateImageAttachmentDto } from './dto/update-image-attachment.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('Image Attachments')
@ApiBearerAuth()
@Controller('image-attachments')
export class ImageAttachmentsController {
  constructor(
    private readonly service: ImageAttachmentsService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Attach image (URL) to a daily log' })
  create(@Body() dto: CreateImageAttachmentDto) {
    return this.service.create(dto);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload an image file and attach it to a daily log' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        dailyLogId: { type: 'number' },
        imageType: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['file', 'dailyLogId'],
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Only image files are allowed'), false);
      }
      cb(null, true);
    },
  }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('dailyLogId') dailyLogId: string,
    @Body('imageType') imageType?: string,
    @Body('description') description?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const result = await this.cloudinary.uploadImage(file, `daily-log-${dailyLogId}`);
    return this.service.create({
      imageUrl: result.secure_url,
      imageType: imageType ?? 'result',
      description: description ?? undefined,
      dailyLogId: Number(dailyLogId),
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get images for a daily log' })
  @ApiQuery({ name: 'dailyLogId', required: true, type: Number })
  findByDailyLog(@Query('dailyLogId', ParseIntPipe) dailyLogId: number) {
    return this.service.findByDailyLog(dailyLogId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get image by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update image metadata' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateImageAttachmentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete image attachment' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
