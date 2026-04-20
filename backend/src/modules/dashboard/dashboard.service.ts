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
      case SystemRole.DOCENTE:
        return SystemRole.DOCENTE;
      case SystemRole.EVALUADOR:
        return SystemRole.EVALUADOR;
      case SystemRole.COORDINADOR:
      default:
        return SystemRole.COORDINADOR;
    }
  }

  private async buildSummary(role: SystemRole, userId?: number) {
    const projectScope = this.getProjectScope(role, userId);

    if (role === SystemRole.DOCENTE) {
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
                  user: { role: SystemRole.DOCENTE },
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
        { label: 'Casos en revision', value: casesInReview },
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
      return [{ label: 'Sin actividad registrada todavia', value: '-' }];
    }

    return activity.slice(0, 3);
  }

  private getProjectScope(role: SystemRole, userId?: number) {
    if (role === SystemRole.COORDINADOR) {
      return undefined;
    }

    if (Number.isFinite(userId) && userId) {
      return {
        projectUsers: {
          some: {
            userId,
          },
        },
      };
    }

    return {
      projectUsers: {
        some: {
          user: {
            role,
          },
        },
      },
    };
  }

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(value);
  }
}
