import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChecklistResult,
  EvidenceStatus,
  PhaseStatus,
  Prisma,
  ProjectStatus,
  SolvedProblemOption,
  SummaryChecklistResult,
  SystemRole,
  YesNoOption,
} from '@prisma/client';
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

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

const companySummarySelect = {
  id: true,
  nombre: true,
  sector: true,
  representante: {
    select: userSummarySelect,
  },
} as const;

const businessValidationSelect = {
  id: true,
  resolvioProblema: true,
  esAplicable: true,
  generaValor: true,
  deseaImplementarla: true,
  comentarios: true,
  nombreFirmante: true,
  cargo: true,
  firma: true,
} as const;

const projectListSelect = {
  id: true,
  companyId: true,
  participanteId: true,
  evaluadorId: true,
  titulo: true,
  descripcionProblema: true,
  resultadoEsperado: true,
  estado: true,
  fechaInicio: true,
  fechaFin: true,
  company: {
    select: companySummarySelect,
  },
  participante: {
    select: userSummarySelect,
  },
  evaluador: {
    select: userSummarySelect,
  },
  projectPhases: {
    select: {
      id: true,
      estado: true,
      phase: {
        select: {
          nombre: true,
        },
      },
    },
  },
  businessValidation: {
    select: businessValidationSelect,
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
            select: userSummarySelect,
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
    select: businessValidationSelect,
  },
} as const;

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  select: typeof projectListSelect;
}>;

type ProjectDetailWithRelations = Prisma.ProjectGetPayload<{
  select: typeof projectDetailSelect;
}>;

type ProjectRecord = {
  id: number;
  companyId: number;
  participanteId: number;
  evaluadorId: number;
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
    representante: UserRecord;
  };
  participante: UserRecord;
  evaluador: UserRecord;
  users: UserRecord[];
  progress: {
    totalPhases: number;
    completedPhases: number;
    percentage: number;
  };
  validationReady: boolean;
  validationCompleted: boolean;
  businessValidation: BusinessValidationRecord;
};

type ProjectPhaseRecord = {
  id: number;
  orden: number;
  nombre: string;
  estado: string;
  observaciones: string | null;
  isCurrent: boolean;
  isLocked: boolean;
  isCompleted: boolean;
  isAvailable: boolean;
  evidenceCount: number;
  checklistCount: number;
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
  user: UserRecord;
};

type ProjectChecklistRecord = {
  id: number;
  fase: string;
  criterio: string;
  resultado: string;
  observacion: string | null;
};

type BusinessValidationRecord = {
  id: number;
  resolvioProblema: string;
  esAplicable: string;
  generaValor: string;
  deseaImplementarla: string;
  comentarios: string | null;
  nombreFirmante: string;
  cargo: string;
  firma: string;
} | null;

type ProjectDetailRecord = ProjectRecord & {
  currentPhase: ProjectPhaseRecord | null;
  progress: {
    totalPhases: number;
    completedPhases: number;
    percentage: number;
  };
  phases: ProjectPhaseRecord[];
  evidences: ProjectEvidenceRecord[];
  phaseChecklist: {
    phaseId: number;
    fase: string;
    items: {
      id: number;
      item: string;
      resultado: string;
      observacion: string | null;
    }[];
  }[];
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
    const participanteId = this.parseEntityId(
      body.participanteId,
      'El participante es obligatorio',
    );
    const evaluadorId = this.parseEntityId(
      body.evaluadorId,
      'El evaluador es obligatorio',
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
    const fechaInicio = this.parseOptionalDate(
      body.fechaInicio,
      'La fecha de inicio',
    );
    const fechaFin = this.parseOptionalDate(body.fechaFin, 'La fecha de fin');

    this.validateDateRange(fechaInicio, fechaFin);
    await this.ensureCompanyExists(companyId);
    await this.ensureUserWithRole(
      participanteId,
      SystemRole.PARTICIPANTE,
      'Participante no encontrado',
      'El usuario seleccionado no tiene rol PARTICIPANTE',
    );
    await this.ensureUserWithRole(
      evaluadorId,
      SystemRole.EVALUADOR,
      'Evaluador no encontrado',
      'El usuario seleccionado no tiene rol EVALUADOR',
    );

    const project = await this.prisma.project.create({
      data: {
        company: {
          connect: { id: companyId },
        },
        participante: {
          connect: { id: participanteId },
        },
        evaluador: {
          connect: { id: evaluadorId },
        },
        titulo,
        descripcionProblema,
        resultadoEsperado,
        estado: ProjectStatus.PENDING,
        fechaInicio,
        fechaFin,
      },
      select: projectListSelect,
    });

    return { project: this.mapProject(project) };
  }

  async getProjects(rawSearch?: string, rawUserId?: string) {
    await this.syncExpiredProjects();

    const search = typeof rawSearch === 'string' ? rawSearch.trim() : '';
    const userId = rawUserId
      ? this.parseEntityId(rawUserId, 'Identificador de usuario invalido')
      : null;
    const filters: Prisma.ProjectWhereInput[] = [];
    const searchFilter = this.buildProjectSearchFilter(search);

    if (searchFilter) {
      filters.push(searchFilter);
    }

    if (userId) {
      filters.push({
        OR: [{ participanteId: userId }, { evaluadorId: userId }],
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

  async getRepresentativeProjects(
    rawRepresentanteId: string,
    rawSearch?: string,
  ) {
    await this.syncExpiredProjects();

    const representanteId = this.parseEntityId(
      rawRepresentanteId,
      'Identificador de representante invalido',
    );
    const search = typeof rawSearch === 'string' ? rawSearch.trim() : '';

    await this.ensureUserWithRole(
      representanteId,
      SystemRole.REPRESENTANTE,
      'Representante no encontrado',
      'El usuario seleccionado no tiene rol REPRESENTANTE',
    );

    const filters: Prisma.ProjectWhereInput[] = [
      {
        company: {
          is: {
            representanteId,
          },
        },
      },
    ];
    const searchFilter = this.buildProjectSearchFilter(search);

    if (searchFilter) {
      filters.push(searchFilter);
    }

    const projects = await this.prisma.project.findMany({
      where: {
        AND: filters,
      },
      orderBy: { id: 'asc' },
      select: projectListSelect,
    });

    return { projects: projects.map((project) => this.mapProject(project)) };
  }

  async getProject(rawId: string): Promise<ProjectDetailResponse> {
    const projectId = this.parseProjectId(rawId);
    await this.syncExpiredProjects(projectId);
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
    await this.syncExpiredProjects(projectId);
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
        estado: true,
        project: {
          select: {
            participanteId: true,
            estado: true,
            fechaFin: true,
          },
        },
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

    if (this.hasProjectExpired(projectPhase.project.fechaFin)) {
      throw new BadRequestException(
        'La fecha de finalizacion del proyecto ha vencido. El proyecto fue marcado como cancelado. No se pueden registrar mas evidencias.',
      );
    }

    if (projectPhase.project.participanteId !== userId) {
      throw new BadRequestException(
        'Solo el participante asignado puede registrar evidencias',
      );
    }

    if (projectPhase.project.estado === ProjectStatus.COMPLETED) {
      throw new BadRequestException(
        'El proyecto ya fue completado y no admite nuevas evidencias',
      );
    }

    if (projectPhase.project.estado === ProjectStatus.CANCELLED) {
      throw new BadRequestException(
        'El proyecto fue cancelado y no admite nuevas evidencias',
      );
    }

    const orderedProjectPhases = await this.prisma.projectPhase.findMany({
      where: { projectId },
      select: {
        id: true,
        estado: true,
        phase: {
          select: {
            nombre: true,
          },
        },
      },
    });

    const activePhase = this.getActiveProjectPhase(orderedProjectPhases);

    if (!activePhase) {
      throw new BadRequestException('El proyecto ya completo todas sus fases');
    }

    if (activePhase.id !== projectPhaseId) {
      throw new BadRequestException(
        `Solo puedes registrar evidencias en la fase actual: ${activePhase.phase.nombre}`,
      );
    }

    if (projectPhase.estado === PhaseStatus.IN_REVIEW) {
      throw new BadRequestException(
        'La fase actual esta siendo revisada por el evaluador',
      );
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
          select: userSummarySelect,
        },
      },
    });

    const projectUpdates: Prisma.ProjectUpdateInput = {};

    if (projectPhase.estado === PhaseStatus.PENDING) {
      await this.prisma.projectPhase.update({
        where: { id: projectPhaseId },
        data: {
          estado: PhaseStatus.IN_PROGRESS,
        },
      });
    }

    if (projectPhase.project.estado === ProjectStatus.PENDING) {
      projectUpdates.estado = ProjectStatus.IN_PROGRESS;
    }

    if (Object.keys(projectUpdates).length > 0) {
      await this.prisma.project.update({
        where: { id: projectId },
        data: projectUpdates,
      });
    }

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
        user: this.mapUser(evidence.user),
      },
    };
  }

  async updateProject(
    rawId: string,
    body: Record<string, unknown>,
  ): Promise<ProjectResponse> {
    const projectId = this.parseProjectId(rawId);
    await this.syncExpiredProjects(projectId);
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        estado: true,
        fechaInicio: true,
        fechaFin: true,
      },
    });

    if (!existingProject) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    const data: Prisma.ProjectUpdateInput = {};
    let nextFechaInicio = existingProject.fechaInicio;
    let nextFechaFin = existingProject.fechaFin;

    if (body.companyId !== undefined) {
      const companyId = this.parseEntityId(
        body.companyId,
        'La empresa es obligatoria',
      );
      await this.ensureCompanyExists(companyId);
      data.company = {
        connect: { id: companyId },
      };
    }

    if (body.participanteId !== undefined) {
      const participanteId = this.parseEntityId(
        body.participanteId,
        'El participante es obligatorio',
      );
      await this.ensureUserWithRole(
        participanteId,
        SystemRole.PARTICIPANTE,
        'Participante no encontrado',
        'El usuario seleccionado no tiene rol PARTICIPANTE',
      );
      data.participante = {
        connect: { id: participanteId },
      };
    }

    if (body.evaluadorId !== undefined) {
      const evaluadorId = this.parseEntityId(
        body.evaluadorId,
        'El evaluador es obligatorio',
      );
      await this.ensureUserWithRole(
        evaluadorId,
        SystemRole.EVALUADOR,
        'Evaluador no encontrado',
        'El usuario seleccionado no tiene rol EVALUADOR',
      );
      data.evaluador = {
        connect: { id: evaluadorId },
      };
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

    if (
      existingProject.estado === ProjectStatus.CANCELLED &&
      !this.hasProjectExpired(nextFechaFin) &&
      (body.estado === undefined || data.estado === ProjectStatus.CANCELLED)
    ) {
      data.estado = ProjectStatus.IN_PROGRESS;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No hay datos para actualizar');
    }

    this.validateDateRange(nextFechaInicio, nextFechaFin);

    await this.prisma.project.update({
      where: { id: projectId },
      data,
      select: projectListSelect,
    });

    await this.syncExpiredProjects(projectId);

    const refreshedProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: projectListSelect,
    });

    if (!refreshedProject) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    return { project: this.mapProject(refreshedProject) };
  }

  async updateProjectEvaluation(
    rawId: string,
    body: Record<string, unknown>,
  ): Promise<ProjectDetailResponse> {
    const projectId = this.parseProjectId(rawId);
    await this.syncExpiredProjects(projectId);
    await this.ensureDefaultProjectPhases(projectId);

    const projectState = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        estado: true,
        fechaFin: true,
      },
    });

    if (!projectState) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    if (projectState.estado === ProjectStatus.CANCELLED) {
      if (this.hasProjectExpired(projectState.fechaFin)) {
        throw new BadRequestException(
          'La fecha de finalizacion del proyecto ha vencido. El proyecto fue marcado como cancelado y no admite evaluaciones.',
        );
      }

      throw new BadRequestException(
        'El proyecto fue cancelado y no admite evaluaciones',
      );
    }

    const projectPhaseId = this.parseEntityId(
      body.projectPhaseId,
      'La fase del proyecto es obligatoria',
    );
    const approved = this.parseApprovalDecision(body.approved);
    const observaciones =
      typeof body.observaciones === 'string'
        ? this.parseOptionalText(body.observaciones)
        : null;
    const checklist = this.parsePhaseReviewChecklist(body.phaseChecklist);

    const project = await this.prisma.$transaction(async (tx) => {
      const projectPhases = await tx.projectPhase.findMany({
        where: { projectId },
        select: {
          id: true,
          estado: true,
          evidences: {
            select: {
              id: true,
              estado: true,
            },
          },
          phase: {
            select: {
              nombre: true,
            },
          },
        },
      });

      const activePhase = this.getActiveProjectPhase(projectPhases);

      if (!activePhase) {
        throw new BadRequestException(
          'El proyecto ya completo todas sus fases',
        );
      }

      if (activePhase.id !== projectPhaseId) {
        throw new BadRequestException(
          `Solo puedes evaluar la fase actual: ${activePhase.phase.nombre}`,
        );
      }

      if (activePhase.evidences.length === 0) {
        throw new BadRequestException(
          'No puedes evaluar una fase que aun no tiene evidencias registradas',
        );
      }

      const hasReviewableEvidence = activePhase.evidences.some(
        (evidence) =>
          evidence.estado === EvidenceStatus.PENDING ||
          evidence.estado === EvidenceStatus.IN_REVIEW,
      );

      if (!hasReviewableEvidence) {
        throw new BadRequestException(
          'Ya existe un concepto registrado para las evidencias actuales. Debes esperar a que el participante suba una nueva evidencia para volver a evaluar la fase',
        );
      }

      await tx.phaseChecklist.deleteMany({
        where: { projectPhaseId },
      });

      await tx.phaseChecklist.createMany({
        data: checklist.map((item) => ({
          projectPhaseId,
          item: item.item,
          resultado: item.resultado,
          observacion: item.observacion,
        })),
      });

      await tx.projectPhase.update({
        where: { id: projectPhaseId },
        data: {
          estado: approved ? PhaseStatus.COMPLETED : PhaseStatus.IN_PROGRESS,
          observaciones,
        },
      });

      const evidenceStatus = approved
        ? EvidenceStatus.APPROVED
        : EvidenceStatus.REJECTED;

      await tx.evidence.updateMany({
        where: {
          projectPhaseId,
          estado: {
            in: [EvidenceStatus.PENDING, EvidenceStatus.IN_REVIEW],
          },
        },
        data: {
          estado: evidenceStatus,
          observaciones,
        },
      });

      const sortedProjectPhases = this.sortProjectPhases(projectPhases);
      const currentPhaseIndex = sortedProjectPhases.findIndex(
        (phase) => phase.id === projectPhaseId,
      );
      const nextPhase = sortedProjectPhases
        .slice(currentPhaseIndex + 1)
        .find((phase) => phase.estado !== PhaseStatus.COMPLETED);
      const completedPhases = sortedProjectPhases.filter((phase) =>
        phase.id === projectPhaseId
          ? approved
          : phase.estado === PhaseStatus.COMPLETED,
      ).length;
      const isProjectCompleted =
        approved && completedPhases >= DEFAULT_PROJECT_PHASES.length;

      await tx.project.update({
        where: { id: projectId },
        data: {
          estado: isProjectCompleted
            ? ProjectStatus.COMPLETED
            : ProjectStatus.IN_PROGRESS,
        },
      });

      if (approved && nextPhase && nextPhase.estado === PhaseStatus.IN_REVIEW) {
        await tx.projectPhase.update({
          where: { id: nextPhase.id },
          data: {
            estado: PhaseStatus.PENDING,
          },
        });
      }

      return tx.project.findUnique({
        where: { id: projectId },
        select: projectDetailSelect,
      });
    });

    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    return { project: this.mapProjectDetail(project) };
  }

  async updateProjectBusinessValidation(
    rawId: string,
    body: Record<string, unknown>,
  ): Promise<ProjectDetailResponse> {
    const projectId = this.parseProjectId(rawId);
    await this.syncExpiredProjects(projectId);
    await this.ensureDefaultProjectPhases(projectId);

    const projectState = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        estado: true,
        fechaFin: true,
      },
    });

    if (!projectState) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    if (projectState.estado === ProjectStatus.CANCELLED) {
      if (this.hasProjectExpired(projectState.fechaFin)) {
        throw new BadRequestException(
          'La fecha de finalizacion del proyecto ha vencido. El proyecto fue marcado como cancelado y no admite validacion empresarial.',
        );
      }

      throw new BadRequestException(
        'El proyecto fue cancelado y no admite validacion empresarial',
      );
    }

    const representanteId = this.parseEntityId(
      body.representanteId,
      'El representante es obligatorio',
    );
    const validation = this.parseBusinessValidation(
      body.businessValidation ?? body,
    );

    await this.ensureUserWithRole(
      representanteId,
      SystemRole.REPRESENTANTE,
      'Representante no encontrado',
      'El usuario seleccionado no tiene rol REPRESENTANTE',
    );

    const project = await this.prisma.$transaction(async (tx) => {
      const existingProject = await tx.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          estado: true,
          company: {
            select: {
              representanteId: true,
            },
          },
          projectPhases: {
            select: {
              estado: true,
              phase: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
      });

      if (!existingProject) {
        throw new NotFoundException('Proyecto no encontrado');
      }

      if (existingProject.company.representanteId !== representanteId) {
        throw new BadRequestException(
          'Este proyecto no pertenece a la empresa asociada al representante',
        );
      }

      if (!this.isProjectReadyForBusinessValidation(existingProject)) {
        throw new BadRequestException(
          'La validacion empresarial solo se habilita cuando el proyecto esta listo para cierre',
        );
      }

      await tx.businessValidation.upsert({
        where: { projectId },
        create: {
          projectId,
          ...validation,
        },
        update: validation,
      });

      return tx.project.findUnique({
        where: { id: projectId },
        select: projectDetailSelect,
      });
    });

    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    return { project: this.mapProjectDetail(project) };
  }

  async deleteProject(rawId: string) {
    const projectId = this.parseProjectId(rawId);
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
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

    await this.prisma.project.delete({
      where: { id: projectId },
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
        nombre: true,
      },
    });

    await this.prisma.projectPhase.createMany({
      data: this.sortPhasesByDefaultOrder(phases).map((phase) => ({
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

  private async ensureUserWithRole(
    userId: number,
    role: SystemRole,
    notFoundMessage: string,
    invalidRoleMessage: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(notFoundMessage);
    }

    if (user.role !== role) {
      throw new BadRequestException(invalidRoleMessage);
    }
  }

  private validateDateRange(fechaInicio: Date | null, fechaFin: Date | null) {
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio',
      );
    }
  }

  private hasProjectExpired(fechaFin: Date | null) {
    return Boolean(fechaFin && new Date() > fechaFin);
  }

  private async syncExpiredProjects(projectId?: number) {
    const where: Prisma.ProjectWhereInput = {
      fechaFin: {
        not: null,
        lt: new Date(),
      },
      estado: {
        in: [ProjectStatus.PENDING, ProjectStatus.IN_PROGRESS],
      },
      ...(projectId ? { id: projectId } : {}),
    };

    await this.prisma.project.updateMany({
      where,
      data: {
        estado: ProjectStatus.CANCELLED,
      },
    });
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

  private buildProjectSearchFilter(search: string) {
    if (!search) {
      return null;
    }

    const statusFilter = this.normalizeStatusFilter(search);

    return {
      OR: [
        { titulo: { contains: search } },
        { descripcionProblema: { contains: search } },
        { resultadoEsperado: { contains: search } },
        {
          company: {
            is: {
              OR: [
                { nombre: { contains: search } },
                { sector: { contains: search } },
                {
                  representante: {
                    is: {
                      OR: [
                        { name: { contains: search } },
                        { email: { contains: search } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          participante: {
            is: {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
              ],
            },
          },
        },
        {
          evaluador: {
            is: {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
              ],
            },
          },
        },
        ...(statusFilter ? [{ estado: statusFilter }] : []),
      ],
    } satisfies Prisma.ProjectWhereInput;
  }

  private normalizeText(value: string) {
    return value.trim().replace(/\s+/g, ' ');
  }

  private normalizePhaseName(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private getPhaseOrder(value: string) {
    const phaseIndex = DEFAULT_PROJECT_PHASES.findIndex(
      (phaseName) =>
        this.normalizePhaseName(phaseName) === this.normalizePhaseName(value),
    );

    return phaseIndex === -1 ? Number.MAX_SAFE_INTEGER : phaseIndex;
  }

  private sortPhasesByDefaultOrder<T extends { nombre: string }>(phases: T[]) {
    return [...phases].sort(
      (left, right) =>
        this.getPhaseOrder(left.nombre) - this.getPhaseOrder(right.nombre),
    );
  }

  private sortProjectPhases<
    T extends {
      phase: {
        nombre: string;
      };
    },
  >(projectPhases: T[]) {
    return [...projectPhases].sort(
      (left, right) =>
        this.getPhaseOrder(left.phase.nombre) -
        this.getPhaseOrder(right.phase.nombre),
    );
  }

  private getActiveProjectPhase<
    T extends {
      estado: PhaseStatus;
      phase: {
        nombre: string;
      };
    },
  >(projectPhases: T[]) {
    return this.sortProjectPhases(projectPhases).find(
      (phase) => phase.estado !== PhaseStatus.COMPLETED,
    );
  }

  private buildPhaseProgress(
    phases: Array<{
      estado: string;
    }>,
  ) {
    const totalPhases = DEFAULT_PROJECT_PHASES.length;
    const completedPhases = phases.filter(
      (phase) => phase.estado === PhaseStatus.COMPLETED,
    ).length;
    const percentage = Number(
      ((completedPhases / totalPhases) * 100).toFixed(1),
    );

    return {
      totalPhases,
      completedPhases,
      percentage,
    };
  }

  private isProjectReadyForBusinessValidation(project: {
    estado: ProjectStatus;
    projectPhases: Array<{
      estado: PhaseStatus;
    }>;
  }) {
    if (project.estado === ProjectStatus.CANCELLED) {
      return false;
    }

    if (project.estado === ProjectStatus.COMPLETED) {
      return true;
    }

    const progress = this.buildPhaseProgress(project.projectPhases);
    return progress.percentage >= 100;
  }

  private buildEvidenceFileUrl(projectId: number, filename: string) {
    const safeFilename = filename.replace(/\\/g, '/');

    if (
      !safeFilename ||
      safeFilename.includes('..') ||
      extname(safeFilename) === ''
    ) {
      throw new BadRequestException('Nombre de archivo invalido');
    }

    return `/uploads/${projectId}/${safeFilename}`;
  }

  private mapProject(project: ProjectWithRelations): ProjectRecord {
    const participante = this.mapUser(project.participante);
    const evaluador = this.mapUser(project.evaluador);
    const orderedProjectPhases = this.sortProjectPhases(project.projectPhases);
    const progress = this.buildPhaseProgress(orderedProjectPhases);
    const businessValidation = this.mapBusinessValidation(
      project.businessValidation,
    );

    return {
      id: project.id,
      companyId: project.companyId,
      participanteId: project.participanteId,
      evaluadorId: project.evaluadorId,
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
        representante: this.mapUser(project.company.representante),
      },
      participante,
      evaluador,
      users: this.buildProjectUsers(participante, evaluador),
      progress,
      validationReady: this.isProjectReadyForBusinessValidation({
        estado: project.estado,
        projectPhases: orderedProjectPhases,
      }),
      validationCompleted: businessValidation !== null,
      businessValidation,
    };
  }

  private mapProjectDetail(
    project: ProjectDetailWithRelations,
  ): ProjectDetailRecord {
    const baseProject = this.mapProject(project);
    const orderedProjectPhases = this.sortProjectPhases(project.projectPhases);
    const currentProjectPhase = orderedProjectPhases.find(
      (projectPhase) => projectPhase.estado !== PhaseStatus.COMPLETED,
    );
    const progress = this.buildPhaseProgress(orderedProjectPhases);

    return {
      ...baseProject,
      currentPhase: currentProjectPhase
        ? {
            id: currentProjectPhase.id,
            orden: this.getPhaseOrder(currentProjectPhase.phase.nombre) + 1,
            nombre: currentProjectPhase.phase.nombre,
            estado: currentProjectPhase.estado,
            observaciones: currentProjectPhase.observaciones,
            isCurrent: true,
            isLocked: false,
            isCompleted: currentProjectPhase.estado === PhaseStatus.COMPLETED,
            isAvailable: true,
            evidenceCount: currentProjectPhase.evidences.length,
            checklistCount: currentProjectPhase.checklist.length,
          }
        : null,
      progress,
      phases: orderedProjectPhases.map((projectPhase, index) => {
        const isCompleted = projectPhase.estado === PhaseStatus.COMPLETED;
        const isCurrent = currentProjectPhase?.id === projectPhase.id;

        return {
          id: projectPhase.id,
          orden: index + 1,
          nombre: projectPhase.phase.nombre,
          estado: projectPhase.estado,
          observaciones: projectPhase.observaciones,
          isCurrent,
          isLocked: !isCompleted && !isCurrent,
          isCompleted,
          isAvailable: isCompleted || isCurrent,
          evidenceCount: projectPhase.evidences.length,
          checklistCount: projectPhase.checklist.length,
        };
      }),
      evidences: orderedProjectPhases.flatMap((projectPhase) =>
        projectPhase.evidences.map((evidence) => ({
          id: evidence.id,
          fase: projectPhase.phase.nombre,
          titulo: evidence.titulo,
          descripcion: evidence.descripcion,
          archivo: evidence.archivo,
          estado: evidence.estado,
          observaciones: evidence.observaciones,
          fecha: evidence.fecha,
          user: this.mapUser(evidence.user),
        })),
      ),
      phaseChecklist: orderedProjectPhases.map((projectPhase) => ({
        phaseId: projectPhase.id,
        fase: projectPhase.phase.nombre,
        items: projectPhase.checklist.map((item) => ({
          id: item.id,
          item: item.item,
          resultado: item.resultado,
          observacion: item.observacion,
        })),
      })),
      checklist: project.summaryChecklist.map((item) =>
        this.mapChecklistItem(item),
      ),
      businessValidation: this.mapBusinessValidation(
        project.businessValidation,
      ),
    };
  }

  private buildProjectUsers(
    participante: UserRecord,
    evaluador: UserRecord,
  ): UserRecord[] {
    const users = new Map<number, UserRecord>();

    users.set(participante.id, participante);
    users.set(evaluador.id, evaluador);

    return [...users.values()];
  }

  private mapUser(
    user: Prisma.UserGetPayload<{ select: typeof userSummarySelect }>,
  ): UserRecord {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
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
      id: validation.id,
      resolvioProblema: validation.resolvioProblema,
      esAplicable: validation.esAplicable,
      generaValor: validation.generaValor,
      deseaImplementarla: validation.deseaImplementarla,
      comentarios: validation.comentarios,
      nombreFirmante: validation.nombreFirmante,
      cargo: validation.cargo,
      firma: validation.firma,
    };
  }

  private parseDetailedChecklist(rawValue: unknown) {
    if (!Array.isArray(rawValue)) {
      throw new BadRequestException(
        'El checklist detallado por fase es obligatorio',
      );
    }

    return rawValue.map((phaseEntry) => {
      if (!phaseEntry || typeof phaseEntry !== 'object') {
        throw new BadRequestException(
          'Formato invalido en checklist detallado',
        );
      }

      const payload = phaseEntry as Record<string, unknown>;
      const fase = this.parseRequiredText(
        payload.fase,
        'La fase del checklist es obligatoria',
      );

      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        throw new BadRequestException(
          `La fase ${fase} debe contener items de evaluacion`,
        );
      }

      return {
        fase,
        items: payload.items.map((itemEntry) => {
          if (!itemEntry || typeof itemEntry !== 'object') {
            throw new BadRequestException(
              `Formato invalido en los items de la fase ${fase}`,
            );
          }

          const itemPayload = itemEntry as Record<string, unknown>;

          return {
            item: this.parseRequiredText(
              itemPayload.item,
              'El item del checklist es obligatorio',
            ),
            resultado: this.parseChecklistResult(itemPayload.resultado),
            observacion:
              typeof itemPayload.observacion === 'string'
                ? this.parseOptionalText(itemPayload.observacion)
                : null,
          };
        }),
      };
    });
  }

  private parseApprovalDecision(rawValue: unknown) {
    if (typeof rawValue === 'boolean') {
      return rawValue;
    }

    if (typeof rawValue === 'string') {
      const normalizedValue = rawValue.trim().toLowerCase();

      if (normalizedValue === 'true') {
        return true;
      }

      if (normalizedValue === 'false') {
        return false;
      }
    }

    throw new BadRequestException(
      'Debes indicar si la fase fue aprobada o rechazada',
    );
  }

  private parsePhaseReviewChecklist(rawValue: unknown) {
    if (!Array.isArray(rawValue) || rawValue.length === 0) {
      throw new BadRequestException(
        'El checklist de evaluacion de la fase es obligatorio',
      );
    }

    return rawValue.map((itemEntry) => {
      if (!itemEntry || typeof itemEntry !== 'object') {
        throw new BadRequestException(
          'Formato invalido en checklist de evaluacion',
        );
      }

      const payload = itemEntry as Record<string, unknown>;

      return {
        item: this.parseRequiredText(
          payload.item,
          'El item del checklist es obligatorio',
        ),
        resultado: this.parseChecklistResult(payload.resultado),
        observacion:
          typeof payload.observacion === 'string'
            ? this.parseOptionalText(payload.observacion)
            : null,
      };
    });
  }

  private parseSummaryChecklist(rawValue: unknown) {
    if (!Array.isArray(rawValue)) {
      throw new BadRequestException('El checklist resumido es obligatorio');
    }

    return rawValue.map((entry) => {
      if (!entry || typeof entry !== 'object') {
        throw new BadRequestException('Formato invalido en checklist resumido');
      }

      const payload = entry as Record<string, unknown>;

      return {
        fase: this.parseRequiredText(
          payload.fase,
          'La fase del checklist resumido es obligatoria',
        ),
        criterio: this.parseRequiredText(
          payload.criterio,
          'El criterio del checklist resumido es obligatorio',
        ),
        resultado: this.parseSummaryChecklistResult(payload.resultado),
        observacion:
          typeof payload.observacion === 'string'
            ? this.parseOptionalText(payload.observacion)
            : null,
      };
    });
  }

  private parseBusinessValidation(rawValue: unknown) {
    if (!rawValue || typeof rawValue !== 'object') {
      throw new BadRequestException('La validacion empresarial es obligatoria');
    }

    const payload = rawValue as Record<string, unknown>;

    return {
      resolvioProblema: this.parseSolvedProblemOption(payload.resolvioProblema),
      esAplicable: this.parseYesNoOption(payload.esAplicable),
      generaValor: this.parseYesNoOption(payload.generaValor),
      deseaImplementarla: this.parseYesNoOption(payload.deseaImplementarla),
      comentarios:
        typeof payload.comentarios === 'string'
          ? this.parseOptionalText(payload.comentarios)
          : null,
      nombreFirmante: this.parseRequiredText(
        payload.nombreFirmante,
        'El nombre del firmante es obligatorio',
      ),
      cargo: this.parseRequiredText(payload.cargo, 'El cargo es obligatorio'),
      firma: this.parseRequiredText(
        payload.firma,
        'La firma de la empresa es obligatoria',
      ),
    };
  }

  private parseChecklistResult(rawValue: unknown): ChecklistResult {
    if (typeof rawValue !== 'string') {
      throw new BadRequestException('Resultado de checklist invalido');
    }

    const value = rawValue.trim().toUpperCase();

    switch (value) {
      case ChecklistResult.CUMPLE:
      case ChecklistResult.NO_CUMPLE:
      case ChecklistResult.NO_APLICA:
        return value;
      default:
        throw new BadRequestException('Resultado de checklist invalido');
    }
  }

  private parseSummaryChecklistResult(
    rawValue: unknown,
  ): SummaryChecklistResult {
    if (typeof rawValue !== 'string') {
      throw new BadRequestException(
        'Resultado del checklist resumido invalido',
      );
    }

    const value = rawValue.trim().toUpperCase();

    switch (value) {
      case SummaryChecklistResult.CUMPLE:
      case SummaryChecklistResult.NO_CUMPLE:
      case SummaryChecklistResult.PARCIAL:
        return value;
      default:
        throw new BadRequestException(
          'Resultado del checklist resumido invalido',
        );
    }
  }

  private parseYesNoOption(rawValue: unknown): YesNoOption {
    if (typeof rawValue !== 'string') {
      throw new BadRequestException('Opcion de validacion invalida');
    }

    const value = rawValue.trim().toUpperCase();

    switch (value) {
      case YesNoOption.SI:
      case YesNoOption.NO:
        return value;
      default:
        throw new BadRequestException('Opcion de validacion invalida');
    }
  }

  private parseSolvedProblemOption(rawValue: unknown): SolvedProblemOption {
    if (typeof rawValue !== 'string') {
      throw new BadRequestException(
        'La respuesta de resolucion del problema es invalida',
      );
    }

    const value = rawValue.trim().toUpperCase();

    switch (value) {
      case SolvedProblemOption.SI:
      case SolvedProblemOption.PARCIAL:
      case SolvedProblemOption.NO:
        return value;
      default:
        throw new BadRequestException(
          'La respuesta de resolucion del problema es invalida',
        );
    }
  }
}
