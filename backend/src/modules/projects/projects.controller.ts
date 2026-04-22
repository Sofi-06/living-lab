import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';

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
  createEvidence(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.projectsService.createEvidence(id, body);
  }

  @Delete(':id')
  deleteProject(@Param('id') id: string) {
    return this.projectsService.deleteProject(id);
  }
}
