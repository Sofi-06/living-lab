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
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { ProjectsService } from './projects.service';

type UploadedEvidenceFile = {
  filename: string;
  originalname: string;
};

type ProjectRequest = Request<{ id: string }>;
type StorageFile = {
  originalname: string;
};
type DestinationCallback = (error: Error | null, destination: string) => void;
type FilenameCallback = (error: Error | null, filename: string) => void;
type StorageEngine = object;
type DiskStorageFactory = (options: {
  destination: (
    req: ProjectRequest,
    file: StorageFile,
    callback: DestinationCallback,
  ) => void;
  filename: (
    req: ProjectRequest,
    file: StorageFile,
    callback: FilenameCallback,
  ) => void;
}) => StorageEngine;

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

const createDiskStorage = diskStorage as unknown as DiskStorageFactory;
const evidenceStorage = createDiskStorage({
  destination: (
    req: ProjectRequest,
    _file: StorageFile,
    callback: DestinationCallback,
  ) => {
    callback(null, ensureUploadDirectory(String(req.params.id)));
  },
  filename: (
    _req: ProjectRequest,
    file: StorageFile,
    callback: FilenameCallback,
  ) => {
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
});

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

  @Get('representative/:representanteId')
  getRepresentativeProjects(
    @Param('representanteId') representanteId: string,
    @Query('search') search?: string,
  ) {
    return this.projectsService.getRepresentativeProjects(
      representanteId,
      search,
    );
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

  @Patch(':id/evaluation')
  updateProjectEvaluation(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.projectsService.updateProjectEvaluation(id, body);
  }

  @Patch(':id/business-validation')
  updateProjectBusinessValidation(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.projectsService.updateProjectBusinessValidation(id, body);
  }

  @Post(':id/evidences')
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: evidenceStorage,
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
