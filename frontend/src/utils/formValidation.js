const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_INPUT_REGEX = /^\d{4}-\d{2}-\d{2}$/

export function normalizeFormText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

export function isValidEmail(value) {
  return EMAIL_REGEX.test(normalizeFormText(value))
}

export function isValidDateInput(value) {
  const normalizedValue = normalizeFormText(value)

  if (!normalizedValue || !DATE_INPUT_REGEX.test(normalizedValue)) {
    return false
  }

  const date = new Date(`${normalizedValue}T00:00:00`)
  return !Number.isNaN(date.getTime())
}

export function getFirstValidationError(errors) {
  return Object.values(errors).find(Boolean) ?? ''
}

export function validateLoginForm(form) {
  const errors = {}
  const email = normalizeFormText(form.email)

  if (!email) {
    errors.email = 'El correo es obligatorio'
  } else if (!isValidEmail(email)) {
    errors.email = 'Ingresa un correo válido'
  }

  if (!form.password) {
    errors.password = 'La contraseña es obligatoria'
  } else if (form.password.length < 4) {
    errors.password = 'La contraseña debe tener mínimo 4 caracteres'
  }

  return errors
}

export function validateUserForm(form, { isEdit = false } = {}) {
  const errors = {}
  const name = normalizeFormText(form.name)
  const email = normalizeFormText(form.email)

  if (!name) {
    errors.name = 'El nombre es obligatorio'
  }

  if (!email) {
    errors.email = 'El correo es obligatorio'
  } else if (!isValidEmail(email)) {
    errors.email = 'Ingresa un correo válido'
  }

  if (!normalizeFormText(form.role)) {
    errors.role = 'El rol es obligatorio'
  }

  if (!isEdit || form.password) {
    if (!form.password) {
      errors.password = 'La contraseña es obligatoria'
    } else if (form.password.length < 4) {
      errors.password = 'La contraseña debe tener mínimo 4 caracteres'
    }
  }

  return errors
}

export function validateCompanyForm(form) {
  const errors = {}
  const nombre = normalizeFormText(form.nombre)
  const sector = normalizeFormText(form.sector)
  const email = normalizeFormText(form.email)
  const telefono = normalizeFormText(form.telefono)

  if (!nombre) {
    errors.nombre = 'El nombre es obligatorio'
  }

  if (!sector) {
    errors.sector = 'El sector es obligatorio'
  }

  if (!normalizeFormText(form.representanteId)) {
    errors.representanteId = 'Debes seleccionar un representante'
  }

  if (email && !isValidEmail(email)) {
    errors.email = 'Ingresa un correo válido'
  }

  if (telefono && !/^\d{7,15}$/.test(telefono)) {
    errors.telefono = 'El teléfono debe contener entre 7 y 15 dígitos'
  }

  return errors
}

export function validateProjectForm(form) {
  const errors = {}

  if (!normalizeFormText(form.companyId)) {
    errors.companyId = 'Debes seleccionar una empresa'
  }

  if (!normalizeFormText(form.participanteId)) {
    errors.participanteId = 'Debes seleccionar un participante'
  }

  if (!normalizeFormText(form.evaluadorId)) {
    errors.evaluadorId = 'Debes seleccionar un evaluador'
  }

  if (!normalizeFormText(form.titulo)) {
    errors.titulo = 'El título es obligatorio'
  }

  if (!normalizeFormText(form.descripcionProblema)) {
    errors.descripcionProblema = 'La descripción del problema es obligatoria'
  }

  if (!normalizeFormText(form.resultadoEsperado)) {
    errors.resultadoEsperado = 'El resultado esperado es obligatorio'
  }

  if (form.fechaInicio && !isValidDateInput(form.fechaInicio)) {
    errors.fechaInicio = 'La fecha de inicio es inválida'
  }

  if (form.fechaFin && !isValidDateInput(form.fechaFin)) {
    errors.fechaFin = 'La fecha de fin es inválida'
  }

  if (
    form.fechaInicio &&
    form.fechaFin &&
    isValidDateInput(form.fechaInicio) &&
    isValidDateInput(form.fechaFin) &&
    form.fechaFin < form.fechaInicio
  ) {
    errors.fechaFin = 'La fecha de fin no puede ser anterior a la fecha de inicio'
  }

  return errors
}

export function validateEvidenceForm(form, options = {}) {
  const errors = {}

  if (!options.currentPhaseId) {
    errors.projectPhaseId = 'No hay una fase activa disponible para registrar evidencias'
  }

  if (!normalizeFormText(form.titulo)) {
    errors.titulo = 'El título es obligatorio'
  }

  if (!form.archivo) {
    errors.archivo = 'Debes seleccionar un archivo'
  }

  if (options.isProjectExpired) {
    errors.fechaFin = 'La fecha de finalización del proyecto ya venció'
  }

  return errors
}

export function validateBusinessValidationForm(form) {
  const errors = {}

  if (!normalizeFormText(form.resolvioProblema)) {
    errors.resolvioProblema = 'Selecciona si el proyecto resolvió el problema'
  }

  if (!normalizeFormText(form.esAplicable)) {
    errors.esAplicable = 'Selecciona si la solución es aplicable'
  }

  if (!normalizeFormText(form.generaValor)) {
    errors.generaValor = 'Selecciona si la solución genera valor'
  }

  if (!normalizeFormText(form.deseaImplementarla)) {
    errors.deseaImplementarla = 'Selecciona si la empresa desea implementar la solución'
  }

  if (!normalizeFormText(form.nombreFirmante)) {
    errors.nombreFirmante = 'El nombre del firmante es obligatorio'
  }

  if (!normalizeFormText(form.cargo)) {
    errors.cargo = 'El cargo es obligatorio'
  }

  if (!normalizeFormText(form.firma) && !form.firmaArchivo) {
    errors.firma = 'La firma de la empresa es obligatoria'
  }

  return errors
}
