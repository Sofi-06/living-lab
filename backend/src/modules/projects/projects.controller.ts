import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { ProjectsService } from './projects.service';

type UploadedEvidenceFile = {
  filename: string;
  originalname: string;
};

function ensureUploadDirectory(projectId: string) {
  const uploadPath = join(process.cwd(), 'uploads', projectId);

  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
  }

  return uploadPath;
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  createProject(@Body() body: Record<string, unknown>) {
    return this.projectsService.createProject(body);
  }

  @Get()
  getProjects(
    @Query('search') search?: string,
    @Query('userId') userId?: string,
  ) {
    return this.projectsService.getProjects(search, userId);
  }

  @Get(':id')
  getProject(@Param('id') id: string) {
    return this.projectsService.getProject(id);
  }

  @Patch(':id')
  updateProject(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.projectsService.updateProject(id, body);
  }

  @Post(':id/evidences')
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: (req, _file, callback) => {
          callback(null, ensureUploadDirectory(String(req.params.id)));
        },
        filename: (_req, file, callback) => {
          const extension = extname(file.originalname);
          const basename = sanitizeFilename(
            file.originalname.slice(
              0,
              Math.max(0, file.originalname.length - extension.length),
            ) || 'evidencia',
          );
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `${uniqueSuffix}-${basename}${extension}`);
        },
      }),
    }),
  )
  createEvidence(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @UploadedFile() file: UploadedEvidenceFile,
  ) {
    return this.projectsService.createEvidence(id, body, file);
  }

  @Delete(':id')
  deleteProject(@Param('id') id: string) {
    return this.projectsService.deleteProject(id);
  }
}
