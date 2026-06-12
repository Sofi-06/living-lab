export const DEFAULT_PROJECT_PHASES = [
  'Co-creación',
  'Acción',
  'Medición',
  'Iteración',
  'Narrativa',
  'Apropiación',
]

export const PHASE_STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  IN_REVIEW: 'En revision',
  COMPLETED: 'Completada',
}

export const EVIDENCE_STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_REVIEW: 'En revision',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
}

export function normalizeText(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function ensureProjectPhases(project) {
  const currentPhases = Array.isArray(project?.phases) ? project.phases : []
  const indexedPhases = new Map(currentPhases.map((phase) => [normalizeText(phase.nombre), phase]))
  const currentPhaseId =
    project?.currentPhase?.id ??
    currentPhases.find((phase) => phase?.isCurrent)?.id ??
    currentPhases.find((phase) => phase?.estado !== 'COMPLETED')?.id ??
    null

  return DEFAULT_PROJECT_PHASES.map((phaseName, index) => {
    const foundPhase = indexedPhases.get(normalizeText(phaseName))

    if (foundPhase) {
      return {
        orden: index + 1,
        evidenceCount: 0,
        checklistCount: 0,
        isCurrent: foundPhase.id === currentPhaseId,
        isCompleted: foundPhase.estado === 'COMPLETED',
        isLocked: foundPhase.estado !== 'COMPLETED' && foundPhase.id !== currentPhaseId,
        isAvailable: foundPhase.estado === 'COMPLETED' || foundPhase.id === currentPhaseId,
        ...foundPhase,
      }
    }

    const isCurrent = currentPhaseId === null && index === 0

    return {
      id: phaseName,
      orden: index + 1,
      nombre: phaseName,
      estado: 'PENDING',
      observaciones: null,
      evidenceCount: 0,
      checklistCount: 0,
      isCurrent,
      isCompleted: false,
      isLocked: !isCurrent,
      isAvailable: isCurrent,
    }
  })
}

export function getCurrentProjectPhase(project, phases = ensureProjectPhases(project)) {
  return project?.currentPhase ?? phases.find((phase) => phase.isCurrent) ?? null
}

export function getProjectProgress(project, phases = ensureProjectPhases(project)) {
  if (project?.progress) {
    return project.progress
  }

  const totalPhases = DEFAULT_PROJECT_PHASES.length
  const completedPhases = phases.filter((phase) => phase.estado === 'COMPLETED').length

  return {
    totalPhases,
    completedPhases,
    percentage: Number(((completedPhases / totalPhases) * 100).toFixed(1)),
  }
}

export function getPhaseFlowLabel(phase) {
  if (phase?.isCompleted) return 'Completada'
  if (phase?.isCurrent) return 'Fase actual'
  if (phase?.isLocked) return 'Bloqueada'
  return 'Disponible'
}

export function getPhaseFlowTone(phase) {
  if (phase?.isCompleted) return 'completed'
  if (phase?.isCurrent) return 'current'
  if (phase?.isLocked) return 'locked'
  return 'available'
}
