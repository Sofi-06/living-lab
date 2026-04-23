import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import { extname } from 'node:path';
import { PrismaService } from '../../database/prisma.service';

const DEFAULT_PROJECT_PHASES = [
  'Co-creacion',
  'Accion',
  'Medicion',
  'Iteracion',
  'Narrativa',
  'Apropiacion',
] as const;

const projectListSelect = {
  id: true,
  companyId: true,
  titulo: true,
  descripcionProblema: true,
  resultadoEsperado: true,
  estado: true,
  fechaInicio: true,
  fechaFin: true,
  company: {
    select: {
      id: true,
      nombre: true,
      sector: true,
    },
  },
  projectUsers: {
    orderBy: {
      id: 'asc',
    },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  },
} as const;

const projectDetailSelect = {
  ...projectListSelect,
  projectPhases: {
    orderBy: {
      id: 'asc',
    },
    select: {
      id: true,
      estado: true,
      observaciones: true,
      phase: {
        select: {
          id: true,
          nombre: true,
        },
      },
      evidences: {
        orderBy: {
          fecha: 'desc',
        },
        select: {
          id: true,
          titulo: true,
          descripcion: true,
          archivo: true,
          estado: true,
          observaciones: true,
          fecha: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      checklist: {
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          item: true,
          resultado: true,
          observacion: true,
        },
      },
    },
  },
  summaryChecklist: {
    orderBy: {
      id: 'asc',
    },
    select: {
      id: true,
      fase: true,
      criterio: true,
      resultado: true,
      observacion: true,
    },
  },
  businessValidation: {
    select: {
      id: true,
      resolvioProblema: true,
      esAplicable: true,
      generaValor: true,
      deseaImplementarla: true,
      comentarios: true,
      nombreFirmante: true,
      cargo: true,
    },
  },
} as const;

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  select: typeof projectListSelect;
}>;

type ProjectDetailWithRelations = Prisma.ProjectGetPayload<{
  select: typeof projectDetailSelect;
}>;

type ProjectUserRecord = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type ProjectRecord = {
  id: number;
  companyId: number;
  titulo: string;
  descripcionProblema: string;
  resultadoEsperado: string;
  estado: string;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  company: {
    id: number;
    nombre: string;
    sector: string;
  };
  users: ProjectUserRecord[];
};

type ProjectPhaseRecord = {
  id: number;
  nombre: string;
  estado: string;
  observaciones: string | null;
};

type ProjectEvidenceRecord = {
  id: number;
  fase: string;
  titulo: string;
  descripcion: string | null;
  archivo: string;
  estado: string;
  observaciones: string | null;
  fecha: Date;
  user: ProjectUserRecord;
};

type ProjectChecklistRecord = {
  id: number;
  fase: string;
  criterio: string;
  resultado: string;
  observacion: string | null;
};

type BusinessValidationRecord = {
  resolvioProblema: string;
  esAplicable: string;
  generaValor: string;
  deseaImplementarla: string;
  comentarios: string | null;
  nombreFirmante: string;
  cargo: string;
} | null;

type ProjectDetailRecord = ProjectRecord & {
  phases: ProjectPhaseRecord[];
  evidences: ProjectEvidenceRecord[];
  checklist: ProjectChecklistRecord[];
  businessValidation: BusinessValidationRecord;
};

type ProjectResponse = {
  project: ProjectRecord;
};

type ProjectDetailResponse = {
  project: ProjectDetailRecord;
};

type ProjectEvidenceResponse = {
  evidence: ProjectEvidenceRecord;
};

type UploadedEvidenceFile = {
  filename: string;
  originalname: string;
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(body: Record<string, unknown>): Promise<ProjectResponse> {
    const companyId = this.parseEntityId(
      body.companyId,
      'La empresa es obligatoria',
    );
    const titulo = this.parseRequiredText(
      body.titulo,
      'El titulo es obligatorio',
    );
    const descripcionProblema = this.parseRequiredText(
      body.descripcionProblema,
      'La descripcion del problema es obligatoria',
    );
    const resultadoEsperado = this.parseRequiredText(
      body.resultadoEsperado,
      'El resultado esperado es obligatorio',
    );
    const estado = this.parseProjectStatus(body.estado);
    const fechaInicio = this.parseOptionalDate(
      body.fechaInicio,
      'La fecha de inicio',
    );
    const fechaFin = this.parseOptionalDate(body.fechaFin, 'La fecha de fin');
    const userIds = this.parseUserIds(body.userIds);

    this.validateDateRange(fechaInicio, fechaFin);
    await this.ensureCompanyExists(companyId);
    await this.ensureUsersExist(userIds);

    const project = await this.prisma.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          companyId,
          titulo,
          descripcionProblema,
          resultadoEsperado,
          estado,
          fechaInicio,
          fechaFin,
        },
        select: { id: true },
      });

      await tx.projectUser.createMany({
        data: userIds.map((userId) => ({
          projectId: createdProject.id,
          userId,
        })),
      });

      return tx.project.findUnique({
        where: { id: createdProject.id },
        select: projectListSelect,
      });
    });

    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    return { project: this.mapProject(project) };
  }

  async getProjects(rawSearch?: string, rawUserId?: string) {
    const search = typeof rawSearch === 'string' ? rawSearch.trim() : '';
    const userId = rawUserId
      ? this.parseEntityId(rawUserId, 'Identificador de usuario invalido')
      : null;
    const statusFilter = this.normalizeStatusFilter(search);
    const filters: Prisma.ProjectWhereInput[] = [];

    if (search) {
      filters.push({
        OR: [
          { titulo: { contains: search } },
          {
            descripcionProblema: {
              contains: search,
            },
          },
          {
            resultadoEsperado: {
              contains: search,
            },
          },
          {
            company: {
              is: {
                nombre: { contains: search },
              },
            },
          },
          {
            projectUsers: {
              some: {
                user: {
                  OR: [
                    {
                      name: {
                        contains: search,
                      },
                    },
                    {
                      email: {
                        contains: search,
                      },
                    },
                  ],
                },
              },
            },
          },
          ...(statusFilter ? [{ estado: statusFilter }] : []),
        ],
      });
    }

    if (userId) {
      filters.push({
        projectUsers: {
          some: {
            userId,
          },
        },
      });
    }

    const where = filters.length > 0 ? { AND: filters } : undefined;

    const projects = await this.prisma.project.findMany({
      where,
      orderBy: { id: 'asc' },
      select: projectListSelect,
    });

    return { projects: projects.map((project) => this.mapProject(project)) };
  }

  async getProject(rawId: string): Promise<ProjectDetailResponse> {
    const projectId = this.parseProjectId(rawId);
    await this.ensureDefaultProjectPhases(projectId);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: projectDetailSelect,
    });

    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    return { project: this.mapProjectDetail(project) };
  }

  async createEvidence(
    rawId: string,
    body: Record<string, unknown>,
    file?: UploadedEvidenceFile,
  ): Promise<ProjectEvidenceResponse> {
    const projectId = this.parseProjectId(rawId);
    await this.ensureDefaultProjectPhases(projectId);

    const projectPhaseId = this.parseEntityId(
      body.projectPhaseId,
      'La fase del proyecto es obligatoria',
    );
    const userId = this.parseEntityId(body.userId, 'El usuario es obligatorio');
    const titulo = this.parseRequiredText(
      body.titulo,
      'El titulo es obligatorio',
    );
    const descripcion =
      typeof body.descripcion === 'string'
        ? this.parseOptionalText(body.descripcion)
        : null;

    if (!file) {
      throw new BadRequestException('El archivo es obligatorio');
    }

    const archivo = this.buildEvidenceFileUrl(projectId, file.filename);

    await this.ensureProjectExists(projectId);
    await this.ensureUsersExist([userId]);

    const projectPhase = await this.prisma.projectPhase.findFirst({
      where: {
        id: projectPhaseId,
        projectId,
      },
      select: {
        id: true,
        phase: {
          select: {
            nombre: true,
          },
        },
      },
    });

    if (!projectPhase) {
      throw new NotFoundException('La fase del proyecto no existe');
    }

    const evidence = await this.prisma.evidence.create({
      data: {
        projectPhaseId,
        userId,
        titulo,
        descripcion,
        archivo,
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        archivo: true,
        estado: true,
        observaciones: true,
        fecha: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return {
      evidence: {
        id: evidence.id,
        fase: projectPhase.phase.nombre,
        titulo: evidence.titulo,
        descripcion: evidence.descripcion,
        archivo: evidence.archivo,
        estado: evidence.estado,
        observaciones: evidence.observaciones,
        fecha: evidence.fecha,
        user: {
          id: evidence.user.id,
          name: evidence.user.name,
          email: evidence.user.email,
          role: evidence.user.role,
        },
      },
    };
  }

  async updateProject(
    rawId: string,
    body: Record<string, unknown>,
  ): Promise<ProjectResponse> {
    const projectId = this.parseProjectId(rawId);
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        companyId: true,
        fechaInicio: true,
        fechaFin: true,
      },
    });

    if (!existingProject) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    const data: Prisma.ProjectUpdateInput = {};
    let companyId: number | undefined;
    let userIds: number[] | undefined;
    let nextFechaInicio = existingProject.fechaInicio;
    let nextFechaFin = existingProject.fechaFin;

    if (body.companyId !== undefined) {
      companyId = this.parseEntityId(
        body.companyId,
        'La empresa es obligatoria',
      );
      data.company = { connect: { id: companyId } };
    }

    if (typeof body.titulo === 'string') {
      data.titulo = this.parseExistingText(
        body.titulo,
        'El titulo es obligatorio',
      );
    }

    if (typeof body.descripcionProblema === 'string') {
      data.descripcionProblema = this.parseExistingText(
        body.descripcionProblema,
        'La descripcion del problema es obligatoria',
      );
    }

    if (typeof body.resultadoEsperado === 'string') {
      data.resultadoEsperado = this.parseExistingText(
        body.resultadoEsperado,
        'El resultado esperado es obligatorio',
      );
    }

    if (body.estado !== undefined) {
      data.estado = this.parseProjectStatus(body.estado);
    }

    if (body.fechaInicio !== undefined) {
      nextFechaInicio = this.parseOptionalDate(
        body.fechaInicio,
        'La fecha de inicio',
      );
      data.fechaInicio = nextFechaInicio;
    }

    if (body.fechaFin !== undefined) {
      nextFechaFin = this.parseOptionalDate(body.fechaFin, 'La fecha de fin');
      data.fechaFin = nextFechaFin;
    }

    if (body.userIds !== undefined) {
      userIds = this.parseUserIds(body.userIds);
    }

    if (Object.keys(data).length === 0 && userIds === undefined) {
      throw new BadRequestException('No hay datos para actualizar');
    }

    this.validateDateRange(nextFechaInicio, nextFechaFin);

    if (companyId !== undefined) {
      await this.ensureCompanyExists(companyId);
    }

    if (userIds !== undefined) {
      await this.ensureUsersExist(userIds);
    }

    const project = await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data,
      });

      if (userIds !== undefined) {
        await tx.projectUser.deleteMany({
          where: { projectId },
        });

        await tx.projectUser.createMany({
          data: userIds.map((userId) => ({
            projectId,
            userId,
          })),
        });
      }

      return tx.project.findUnique({
        where: { id: projectId },
        select: projectListSelect,
      });
    });

    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    return { project: this.mapProject(project) };
  }

  async deleteProject(rawId: string) {
    const projectId = this.parseProjectId(rawId);
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        titulo: true,
        projectPhases: {
          select: { id: true },
          take: 1,
        },
        summaryChecklist: {
          select: { id: true },
          take: 1,
        },
        businessValidation: {
          select: { id: true },
        },
      },
    });

    if (!existingProject) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    const hasAssociations =
      existingProject.projectPhases.length > 0 ||
      existingProject.summaryChecklist.length > 0 ||
      existingProject.businessValidation !== null;

    if (hasAssociations) {
      throw new BadRequestException(
        'No se puede eliminar el proyecto porque tiene informacion asociada',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.projectUser.deleteMany({
        where: { projectId },
      });

      await tx.project.delete({
        where: { id: projectId },
      });
    });

    return { message: 'Proyecto eliminado correctamente' };
  }

  private parseProjectId(rawId: string) {
    const projectId = Number(rawId);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      throw new BadRequestException('Identificador de proyecto invalido');
    }

    return projectId;
  }

  private parseEntityId(rawValue: unknown, message: string) {
    const entityId = Number(rawValue);

    if (!Number.isInteger(entityId) || entityId <= 0) {
      throw new BadRequestException(message);
    }

    return entityId;
  }

  private parseRequiredText(rawValue: unknown, message: string) {
    if (typeof rawValue !== 'string') {
      throw new BadRequestException(message);
    }

    const value = this.normalizeText(rawValue);

    if (!value) {
      throw new BadRequestException(message);
    }

    return value;
  }

  private parseExistingText(rawValue: string, message: string) {
    const value = this.normalizeText(rawValue);

    if (!value) {
      throw new BadRequestException(message);
    }

    return value;
  }

  private parseOptionalText(rawValue: string) {
    const value = this.normalizeText(rawValue);
    return value || null;
  }

  private parseProjectStatus(rawValue: unknown): ProjectStatus {
    if (typeof rawValue !== 'string') {
      throw new BadRequestException('El estado es obligatorio');
    }

    const status = rawValue.trim().toUpperCase();

    switch (status) {
      case ProjectStatus.PENDING:
      case ProjectStatus.IN_PROGRESS:
      case ProjectStatus.COMPLETED:
      case ProjectStatus.CANCELLED:
        return status;
      default:
        throw new BadRequestException('Estado de proyecto invalido');
    }
  }

  private parseOptionalDate(rawValue: unknown, fieldLabel: string) {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return null;
    }

    if (typeof rawValue !== 'string') {
      throw new BadRequestException(`${fieldLabel} invalida`);
    }

    const normalizedValue = rawValue.trim();

    if (!normalizedValue) {
      return null;
    }

    const date = new Date(`${normalizedValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldLabel} invalida`);
    }

    return date;
  }

  private parseUserIds(rawValue: unknown) {
    if (!Array.isArray(rawValue)) {
      throw new BadRequestException(
        'Debes asignar al menos un usuario al proyecto',
      );
    }

    const userIds = [...new Set(rawValue.map(Number))];

    if (
      userIds.length === 0 ||
      userIds.some((userId) => !Number.isInteger(userId) || userId <= 0)
    ) {
      throw new BadRequestException(
        'Debes asignar al menos un usuario al proyecto',
      );
    }

    return userIds;
  }

  private async ensureCompanyExists(companyId: number) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }
  }

  private async ensureProjectExists(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
  }

  private async ensureDefaultProjectPhases(projectId: number) {
    await this.ensureProjectExists(projectId);

    const existingPhases = await this.prisma.phase.findMany({
      where: {
        nombre: {
          in: [...DEFAULT_PROJECT_PHASES],
        },
      },
      select: {
        id: true,
        nombre: true,
      },
    });

    const indexedPhases = new Map(
      existingPhases.map((phase) => [phase.nombre, phase]),
    );
    const missingPhaseNames = DEFAULT_PROJECT_PHASES.filter(
      (phaseName) => !indexedPhases.has(phaseName),
    );

    if (missingPhaseNames.length > 0) {
      await this.prisma.phase.createMany({
        data: missingPhaseNames.map((nombre) => ({ nombre })),
        skipDuplicates: true,
      });
    }

    const phases = await this.prisma.phase.findMany({
      where: {
        nombre: {
          in: [...DEFAULT_PROJECT_PHASES],
        },
      },
      select: {
        id: true,
      },
    });

    await this.prisma.projectPhase.createMany({
      data: phases.map((phase) => ({
        projectId,
        phaseId: phase.id,
      })),
      skipDuplicates: true,
    });
  }

  private async ensureUsersExist(userIds: number[]) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });

    if (users.length !== userIds.length) {
      throw new NotFoundException('Uno o mas usuarios no existen');
    }
  }

  private validateDateRange(fechaInicio: Date | null, fechaFin: Date | null) {
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio',
      );
    }
  }

  private normalizeStatusFilter(rawSearch: string) {
    const normalized = rawSearch.trim().toUpperCase();

    if (
      normalized === ProjectStatus.PENDING ||
      normalized === ProjectStatus.IN_PROGRESS ||
      normalized === ProjectStatus.COMPLETED ||
      normalized === ProjectStatus.CANCELLED
    ) {
      return normalized as ProjectStatus;
    }

    return null;
  }

  private normalizeText(value: string) {
    return value.trim().replaceAll(/\s+/g, ' ');
  }

  private buildEvidenceFileUrl(projectId: number, filename: string) {
    const safeFilename = filename.replace(/\\/g, '/');

    if (!safeFilename || safeFilename.includes('..') || extname(safeFilename) === '') {
      throw new BadRequestException('Nombre de archivo invalido');
    }

    return `/uploads/${projectId}/${safeFilename}`;
  }

  private mapProject(project: ProjectWithRelations): ProjectRecord {
    return {
      id: project.id,
      companyId: project.companyId,
      titulo: project.titulo,
      descripcionProblema: project.descripcionProblema,
      resultadoEsperado: project.resultadoEsperado,
      estado: project.estado,
      fechaInicio: project.fechaInicio,
      fechaFin: project.fechaFin,
      company: {
        id: project.company.id,
        nombre: project.company.nombre,
        sector: project.company.sector,
      },
      users: project.projectUsers.map((projectUser) => ({
        id: projectUser.user.id,
        name: projectUser.user.name,
        email: projectUser.user.email,
        role: projectUser.user.role,
      })),
    };
  }

  private mapProjectDetail(
    project: ProjectDetailWithRelations,
  ): ProjectDetailRecord {
    const baseProject = this.mapProject(project);

    return {
      ...baseProject,
      phases: project.projectPhases.map((projectPhase) => ({
        id: projectPhase.id,
        nombre: projectPhase.phase.nombre,
        estado: projectPhase.estado,
        observaciones: projectPhase.observaciones,
      })),
      evidences: project.projectPhases.flatMap((projectPhase) =>
        projectPhase.evidences.map((evidence) => ({
          id: evidence.id,
          fase: projectPhase.phase.nombre,
          titulo: evidence.titulo,
          descripcion: evidence.descripcion,
          archivo: evidence.archivo,
          estado: evidence.estado,
          observaciones: evidence.observaciones,
          fecha: evidence.fecha,
          user: {
            id: evidence.user.id,
            name: evidence.user.name,
            email: evidence.user.email,
            role: evidence.user.role,
          },
        })),
      ),
      checklist: project.summaryChecklist.map((item) =>
        this.mapChecklistItem(item),
      ),
      businessValidation: this.mapBusinessValidation(
        project.businessValidation,
      ),
    };
  }

  private mapChecklistItem(
    item: ProjectDetailWithRelations['summaryChecklist'][number],
  ): ProjectChecklistRecord {
    return {
      id: item.id,
      fase: item.fase,
      criterio: item.criterio,
      resultado: item.resultado,
      observacion: item.observacion,
    };
  }

  private mapBusinessValidation(
    validation: ProjectDetailWithRelations['businessValidation'],
  ): BusinessValidationRecord {
    if (!validation) {
      return null;
    }

    return {
      resolvioProblema: validation.resolvioProblema,
      esAplicable: validation.esAplicable,
      generaValor: validation.generaValor,
      deseaImplementarla: validation.deseaImplementarla,
      comentarios: validation.comentarios,
      nombreFirmante: validation.nombreFirmante,
      cargo: validation.cargo,
    };
  }
}
