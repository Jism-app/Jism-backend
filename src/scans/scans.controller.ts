import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseJwtPayload } from '../auth/supabase-auth.guard';
import { ScansService, UploadedAngleFile } from './scans.service';
import { listScansSchema, SCAN_ANGLES, ScanAngle } from './dto/scan.dto';

// 8MB per image is generous for a phone-camera JPEG at the resolution
// the capture flow targets; reject anything larger up front rather than
// buffering an oversized upload into memory.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

@Controller('scans')
@UseGuards(SupabaseAuthGuard)
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      SCAN_ANGLES.map((angle) => ({ name: angle, maxCount: 1 })),
      { limits: { fileSize: MAX_IMAGE_BYTES } },
    ),
  )
  async create(
    @CurrentUser() user: SupabaseJwtPayload,
    @UploadedFiles()
    files: Record<ScanAngle, Express.Multer.File[]>,
  ) {
    const angleFiles: UploadedAngleFile[] = [];
    for (const angle of SCAN_ANGLES) {
      const file = files?.[angle]?.[0];
      if (!file) {
        throw new BadRequestException(`Missing image for angle: ${angle}`);
      }
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(`File for ${angle} is not an image`);
      }
      angleFiles.push({ angle, buffer: file.buffer, mimetype: file.mimetype });
    }

    return this.scansService.createScan(user.sub, angleFiles);
  }

  @Get()
  async list(@CurrentUser() user: SupabaseJwtPayload, @Query() query: unknown) {
    const parsed = listScansSchema.parse(query);
    return this.scansService.listScans(user.sub, parsed.limit);
  }

  @Get(':id')
  async getOne(@CurrentUser() user: SupabaseJwtPayload, @Param('id') id: string) {
    return this.scansService.getScan(user.sub, id);
  }

  @Get(':id/images/:angle')
  async getImageUrl(
    @CurrentUser() user: SupabaseJwtPayload,
    @Param('id') id: string,
    @Param('angle') angle: string,
  ) {
    if (!SCAN_ANGLES.includes(angle as ScanAngle)) {
      throw new BadRequestException(`Invalid angle: ${angle}`);
    }
    const url = await this.scansService.getSignedImageUrl(user.sub, id, angle as ScanAngle);
    return { url };
  }
}
