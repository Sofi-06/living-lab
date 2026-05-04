import {
  EvidenceStatus,
  PhaseStatus,
  ProjectStatus,
  SummaryChecklistResult,
  SystemRole,
} from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

type RoleMetrics = {
  kpis: {
    projectsActive: number;
    projectsFinished: number;
    evidencesPending: number;
    evaluationsPending: number;
  };
  summary: Array<{ label: string; value: number }>;
  recentActivity: Array<{ label: string; value: string }>;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(rawRole?: string, userId?: number): Promise<RoleMetrics> {
    await this.syncExpiredProjects();

    const role = this.normalizeRole(rawRole);
    const projectScope = this.getProjectScope(role, userId);

    const activeProjectWhere = projectScope
      ? {
          ...projectScope,
          estado: {
            in: [ProjectStatus.PENDING, ProjectStatus.IN_PROGRESS],
          },
        }
      : {
          estado: {
            in: [ProjectStatus.PENDING, ProjectStatus.IN_PROGRESS],
          },
        };

    const finishedProjectWhere = projectScope
      ? {
          ...projectScope,
          estado: ProjectStatus.COMPLETED,
        }
      : {
          estado: ProjectStatus.COMPLETED,
        };

    const pendingEvidenceWhere = projectScope
      ? {
          estado: {
            in: [EvidenceStatus.PENDING, EvidenceStatus.IN_REVIEW],
          },
          projectPhase: {
            project: projectScope,
          },
        }
      : {
          estado: {
            in: [EvidenceStatus.PENDING, EvidenceStatus.IN_REVIEW],
          },
        };

    const pendingEvaluationWhere = projectScope
      ? {
          estado: {
            in: [PhaseStatus.PENDING, PhaseStatus.IN_REVIEW],
          },
          project: projectScope,
        }
      : {
          estado: {
            in: [PhaseStatus.PENDING, PhaseStatus.IN_REVIEW],
          },
        };

    const [
      projectsActive,
      projectsFinished,
      evidencesPending,
      evaluationsPending,
    ] = await Promise.all([
      this.prisma.project.count({
        where: activeProjectWhere,
      }),
      this.prisma.project.count({
        where: finishedProjectWhere,
      }),
      this.prisma.evidence.count({
        where: pendingEvidenceWhere,
      }),
      this.prisma.projectPhase.count({
        where: pendingEvaluationWhere,
      }),
    ]);

    const [summary, recentActivity] = await Promise.all([
      this.buildSummary(role, userId),
      this.buildRecentActivity(role, userId),
    ]);

    return {
      kpis: {
        projectsActive,
        projectsFinished,
        evidencesPending,
        evaluationsPending,
      },
      summary,
      recentActivity,
    };
  }

  private normalizeRole(rawRole?: string): SystemRole {
    const role =
      typeof rawRole === 'string' ? rawRole.trim().toUpperCase() : '';

    switch (role) {
      case SystemRole.PARTICIPANTE:
        return SystemRole.PARTICIPANTE;
      case SystemRole.EVALUADOR:
        return SystemRole.EVALUADOR;
      case SystemRole.REPRESENTANTE:
        return SystemRole.REPRESENTANTE;
      case SystemRole.COORDINADOR:
      default:
        return SystemRole.COORDINADOR;
    }
  }

  private async buildSummary(role: SystemRole, userId?: number) {
    const projectScope = this.getProjectScope(role, userId);

    if (role === SystemRole.PARTICIPANTE) {
      const whereAssigned = projectScope;

      const [coursesAssigned, teamsInFollowUp, feedbackSent] =
        await Promise.all([
          this.prisma.project.count({ where: whereAssigned }),
          this.prisma.project.count({
            where: {
              ...whereAssigned,
              estado: {
                in: [ProjectStatus.PENDING, ProjectStatus.IN_PROGRESS],
              },
            },
          }),
          this.prisma.evidence.count({
            where: userId
              ? {
                  userId,
                  observaciones: { not: null },
                }
              : {
                  user: { role: SystemRole.PARTICIPANTE },
                  observaciones: { not: null },
                },
          }),
        ]);

      return [
        { label: 'Cursos asignados', value: coursesAssigned },
        { label: 'Equipos en seguimiento', value: teamsInFollowUp },
        { label: 'Retroalimentaciones enviadas', value: feedbackSent },
      ];
    }

    if (role === SystemRole.EVALUADOR) {
      const [casesInReview, committeesScheduled, reportsIssued] =
        await Promise.all([
          this.prisma.projectPhase.count({
            where: {
              estado: PhaseStatus.IN_REVIEW,
              ...(projectScope ? { project: projectScope } : {}),
            },
          }),
          this.prisma.businessValidation.count({
            where: projectScope ? { project: projectScope } : undefined,
          }),
          this.prisma.summaryChecklist.count({
            where: {
              ...(projectScope ? { project: projectScope } : {}),
              resultado: {
                in: [
                  SummaryChecklistResult.CUMPLE,
                  SummaryChecklistResult.NO_CUMPLE,
                  SummaryChecklistResult.PARCIAL,
                ],
              },
            },
          }),
        ]);

      return [
        { label: 'Casos en revisión', value: casesInReview },
        { label: 'Comites programados', value: committeesScheduled },
        { label: 'Informes emitidos', value: reportsIssued },
      ];
    }

    const [totalProjects, usersRegistered, companiesLinked] = await Promise.all(
      [
        this.prisma.project.count(),
        this.prisma.user.count(),
        this.prisma.company.count(),
      ],
    );

    return [
      { label: 'Total proyectos', value: totalProjects },
      { label: 'Usuarios registrados', value: usersRegistered },
      { label: 'Empresas vinculadas', value: companiesLinked },
    ];
  }

  private async buildRecentActivity(role: SystemRole, userId?: number) {
    const projectScope = this.getProjectScope(role, userId);

    if (role === SystemRole.PARTICIPANTE) {
      const [latestOwnEvidence, latestFeedback, latestAssignedProject] =
        await Promise.all([
          this.prisma.evidence.findFirst({
            where: userId
              ? { userId }
              : { user: { role: SystemRole.PARTICIPANTE } },
            orderBy: { fecha: 'desc' },
            select: {
              titulo: true,
              fecha: true,
            },
          }),
          this.prisma.evidence.findFirst({
            where: userId
              ? {
                  userId,
                  observaciones: { not: null },
                }
              : {
                  user: { role: SystemRole.PARTICIPANTE },
                  observaciones: { not: null },
                },
            orderBy: { id: 'desc' },
            select: {
              titulo: true,
              estado: true,
            },
          }),
          this.prisma.project.findFirst({
            where: projectScope
              ? {
                  ...projectScope,
                  estado: {
                    in: [ProjectStatus.PENDING, ProjectStatus.IN_PROGRESS],
                  },
                }
              : {
                  participante: {
                    is: {
                      role: SystemRole.PARTICIPANTE,
                    },
                  },
                  estado: {
                    in: [ProjectStatus.PENDING, ProjectStatus.IN_PROGRESS],
                  },
                },
            orderBy: { id: 'desc' },
            select: {
              titulo: true,
              estado: true,
            },
          }),
        ]);

      const activity: Array<{ label: string; value: string }> = [];

      if (latestOwnEvidence) {
        activity.push({
          label: `Tu ultima evidencia: ${latestOwnEvidence.titulo}`,
          value: this.formatDate(latestOwnEvidence.fecha),
        });
      }

      if (latestFeedback) {
        activity.push({
          label: `Retroalimentacion en: ${latestFeedback.titulo}`,
          value: this.mapEvidenceStatusLabel(latestFeedback.estado),
        });
      }

      if (latestAssignedProject) {
        activity.push({
          label: `Proyecto en seguimiento: ${latestAssignedProject.titulo}`,
          value: this.mapProjectStatusLabel(latestAssignedProject.estado),
        });
      }

      return activity.length > 0
        ? activity
        : [{ label: 'Sin actividad registrada todavía', value: '-' }];
    }

    if (role === SystemRole.EVALUADOR) {
      const [
        latestPendingEvidence,
        latestPendingPhase,
        latestCompletedProject,
      ] = await Promise.all([
        this.prisma.evidence.findFirst({
          where: {
            estado: {
              in: [EvidenceStatus.PENDING, EvidenceStatus.IN_REVIEW],
            },
            ...(projectScope
              ? {
                  projectPhase: {
                    project: projectScope,
                  },
                }
              : {}),
          },
          orderBy: { fecha: 'desc' },
          select: {
            titulo: true,
            fecha: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        }),
        this.prisma.projectPhase.findFirst({
          where: {
            estado: {
              in: [PhaseStatus.PENDING, PhaseStatus.IN_REVIEW],
            },
            ...(projectScope ? { project: projectScope } : {}),
          },
          orderBy: { id: 'desc' },
          select: {
            phase: {
              select: {
                nombre: true,
              },
            },
            project: {
              select: {
                titulo: true,
              },
            },
          },
        }),
        this.prisma.project.findFirst({
          where: projectScope
            ? {
                ...projectScope,
                estado: ProjectStatus.COMPLETED,
              }
            : {
                evaluador: {
                  is: {
                    role: SystemRole.EVALUADOR,
                  },
                },
                estado: ProjectStatus.COMPLETED,
              },
          orderBy: { id: 'desc' },
          select: {
            titulo: true,
          },
        }),
      ]);

      const activity: Array<{ label: string; value: string }> = [];

      if (latestPendingEvidence) {
        activity.push({
          label: `Nueva evidencia por revisar: ${latestPendingEvidence.titulo}`,
          value: latestPendingEvidence.user.name,
        });
      }

      if (latestPendingPhase) {
        activity.push({
          label: `Fase pendiente: ${latestPendingPhase.phase.nombre}`,
          value: latestPendingPhase.project.titulo,
        });
      }

      if (latestCompletedProject) {
        activity.push({
          label: `Proyecto finalizado: ${latestCompletedProject.titulo}`,
          value: 'Listo para cierre',
        });
      }

      return activity.length > 0
        ? activity
        : [{ label: 'Sin actividad registrada todavía', value: '-' }];
    }

    if (role === SystemRole.REPRESENTANTE) {
      const [
        latestPendingValidation,
        latestValidatedProject,
        latestCompanyProject,
      ] = await Promise.all([
        this.prisma.project.findFirst({
          where: {
            ...(projectScope ?? {}),
            estado: ProjectStatus.COMPLETED,
            businessValidation: {
              is: null,
            },
          },
          orderBy: { id: 'desc' },
          select: {
            titulo: true,
          },
        }),
        this.prisma.project.findFirst({
          where: {
            ...(projectScope ?? {}),
            businessValidation: {
              isNot: null,
            },
          },
          orderBy: { id: 'desc' },
          select: {
            titulo: true,
          },
        }),
        this.prisma.project.findFirst({
          where: projectScope ?? undefined,
          orderBy: { id: 'desc' },
          select: {
            titulo: true,
            estado: true,
          },
        }),
      ]);

      const activity: Array<{ label: string; value: string }> = [];

      if (latestPendingValidation) {
        activity.push({
          label: `Validación pendiente: ${latestPendingValidation.titulo}`,
          value: 'Requiere tu concepto',
        });
      }

      if (latestValidatedProject) {
        activity.push({
          label: `Validación registrada: ${latestValidatedProject.titulo}`,
          value: 'Concepto empresarial emitido',
        });
      }

      if (latestCompanyProject) {
        activity.push({
          label: `Proyecto de tu empresa: ${latestCompanyProject.titulo}`,
          value: this.mapProjectStatusLabel(latestCompanyProject.estado),
        });
      }

      return activity.length > 0
        ? activity
        : [{ label: 'Sin actividad registrada todavía', value: '-' }];
    }

    const [latestEvidence, latestUser, latestPhaseReview] = await Promise.all([
      this.prisma.evidence.findFirst({
        where: projectScope
          ? {
              projectPhase: {
                project: projectScope,
              },
            }
          : undefined,
        orderBy: { fecha: 'desc' },
        select: {
          titulo: true,
          fecha: true,
        },
      }),
      this.prisma.user.findFirst({
        where:
          role === SystemRole.COORDINADOR
            ? undefined
            : {
                role,
              },
        orderBy: { createdAt: 'desc' },
        select: {
          name: true,
          createdAt: true,
        },
      }),
      this.prisma.projectPhase.findFirst({
        where: {
          estado: PhaseStatus.IN_REVIEW,
          ...(projectScope ? { project: projectScope } : {}),
        },
        orderBy: { id: 'desc' },
        select: {
          id: true,
          project: {
            select: {
              titulo: true,
            },
          },
        },
      }),
    ]);

    const activity: Array<{ label: string; value: string }> = [];

    if (latestEvidence) {
      activity.push({
        label: `Evidencia registrada: ${latestEvidence.titulo}`,
        value: this.formatDate(latestEvidence.fecha),
      });
    }

    if (latestUser) {
      activity.push({
        label: `Usuario creado: ${latestUser.name}`,
        value: this.formatDate(latestUser.createdAt),
      });
    }

    if (latestPhaseReview) {
      activity.push({
        label: `Fase en revision: ${latestPhaseReview.project.titulo}`,
        value: `Registro #${latestPhaseReview.id}`,
      });
    }

    if (activity.length === 0) {
      return [{ label: 'Sin actividad registrada todavía', value: '-' }];
    }

    return activity.slice(0, 3);
  }

  private getProjectScope(role: SystemRole, userId?: number) {
    if (role === SystemRole.COORDINADOR) {
      return undefined;
    }

    if (role === SystemRole.PARTICIPANTE) {
      if (Number.isFinite(userId) && userId) {
        return { participanteId: userId };
      }

      return {
        participante: {
          is: {
            role: SystemRole.PARTICIPANTE,
          },
        },
      };
    }

    if (role === SystemRole.EVALUADOR) {
      if (Number.isFinite(userId) && userId) {
        return { evaluadorId: userId };
      }

      return {
        evaluador: {
          is: {
            role: SystemRole.EVALUADOR,
          },
        },
      };
    }

    if (role === SystemRole.REPRESENTANTE) {
      if (Number.isFinite(userId) && userId) {
        return {
          company: {
            is: {
              representanteId: userId,
            },
          },
        };
      }

      return {
        company: {
          is: {
            representante: {
              is: {
                role: SystemRole.REPRESENTANTE,
              },
            },
          },
        },
      };
    }

    return undefined;
  }

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(value);
  }

  private mapProjectStatusLabel(status: string) {
    switch (status) {
      case ProjectStatus.PENDING:
        return 'Pendiente';
      case ProjectStatus.IN_PROGRESS:
        return 'En progreso';
      case ProjectStatus.COMPLETED:
        return 'Completado';
      case ProjectStatus.CANCELLED:
        return 'Cancelado';
      default:
        return String(status);
    }
  }

  private mapEvidenceStatusLabel(status: string) {
    switch (status) {
      case EvidenceStatus.PENDING:
        return 'Pendiente';
      case EvidenceStatus.IN_REVIEW:
        return 'En revision';
      case EvidenceStatus.APPROVED:
        return 'Aprobada';
      case EvidenceStatus.REJECTED:
        return 'Requiere ajustes';
      default:
        return String(status);
    }
  }

  private async syncExpiredProjects() {
    await this.prisma.project.updateMany({
      where: {
        fechaFin: {
          not: null,
          lt: new Date(),
        },
        estado: {
          in: [ProjectStatus.PENDING, ProjectStatus.IN_PROGRESS],
        },
      },
      data: {
        estado: ProjectStatus.CANCELLED,
      },
    });
  }
}
