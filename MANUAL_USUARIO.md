# 📘 Manual de Usuario — Sistema LivingLab

> Guía detallada de funcionamiento por rol para todos los usuarios de la plataforma.

---

## 🗂️ Tabla de contenidos

1. [Acceso al sistema](#1-acceso-al-sistema)
2. [Roles disponibles](#2-roles-disponibles)
3. [Rol: Coordinador](#3-rol-coordinador)
4. [Rol: Participante](#4-rol-participante)
5. [Rol: Evaluador](#5-rol-evaluador)
6. [Rol: Representante](#6-rol-representante)
7. [Flujo general del sistema](#7-flujo-general-del-sistema)
8. [Preguntas frecuentes](#8-preguntas-frecuentes)

---

## 1. Acceso al sistema

### Inicio de sesión

1. Ingresa a la URL de la plataforma en tu navegador.
2. Serás redirigido automáticamente a la pantalla de **Login**.
3. Escribe tu **correo electrónico** y **contraseña** registrados.
4. Haz clic en **Iniciar sesión**.
5. El sistema detectará tu rol y te redirigirá al panel correspondiente.

> ⚠️ Si no tienes una cuenta, contacta al **Coordinador** del sistema para que la cree por ti.

### Cierre de sesión

- En cualquier pantalla, haz clic en el botón **Cerrar sesión** ubicado en la barra de navegación superior derecha.
- Serás redirigido a la pantalla de Login.

---

## 2. Roles disponibles

| Rol | Descripción general |
|---|---|
| **Coordinador** | Administrador principal. Gestiona usuarios, empresas, proyectos y genera reportes. |
| **Participante** | Miembro activo de un proyecto. Sube evidencias de avance por fase. |
| **Evaluador** | Revisa evidencias, completa checklists por fase y valida el cierre del proyecto. |
| **Representante** | Representante de una empresa aliada. Realiza la validación empresarial final. |

---

## 3. Rol: Coordinador

El Coordinador es el **administrador principal** de la plataforma. Tiene acceso completo a todas las secciones del sistema.

### 3.1 Panel de control (Dashboard)

Al iniciar sesión, verás el **panel de control** con la siguiente información:

- **Bienvenida** con tu nombre y la fecha actual.
- **Total de usuarios registrados** en el sistema.
- **Tarjetas KPI:**
  - Proyectos activos
  - Proyectos finalizados
  - Evidencias pendientes
  - Evaluaciones pendientes
- **Resumen rápido:** estadísticas generales del sistema.
- **Actividad reciente:** últimas acciones registradas.

---

### 3.2 Gestión de Proyectos

**Ruta:** `Proyectos` en la barra de navegación.

#### Ver listado de proyectos

- Se muestra una tabla con todos los proyectos registrados.
- Cada fila incluye: ID, empresa, título, descripción del problema, resultado esperado, estado, fechas y asignaciones (representante, participante, evaluador).
- Puedes **buscar** por título, empresa, estado o nombre de responsable usando el campo de búsqueda.
- La tabla está **paginada** (8 proyectos por página).

#### Crear un proyecto

1. Haz clic en el botón **"Crear proyecto"**.
2. Completa el formulario con:
   - **Título** del proyecto
   - **Empresa** vinculada
   - **Descripción del problema** que aborda el proyecto
   - **Resultado esperado**
   - **Estado** inicial (`Pendiente`, `En progreso`, `Completado`, `Cancelado`)
   - **Fecha de inicio** y **Fecha de fin**
   - **Asignaciones:** selecciona el Participante, Evaluador y Representante
3. Haz clic en **Guardar**.

#### Editar un proyecto

1. En la tabla de proyectos, haz clic en el ícono ✏️ **Editar** de la fila correspondiente.
2. Modifica los campos que necesites.
3. Guarda los cambios.

#### Ver detalle de un proyecto

1. Haz clic en el ícono 👁️ **Ver** de un proyecto.
2. Verás el detalle completo con pestañas:
   - **Información:** datos generales del proyecto.
   - **Fases:** tabla con el estado de cada fase del ciclo del proyecto.
   - **Evidencias:** listado de todos los archivos subidos por el participante.
   - **Evaluación:** checklists y observaciones del evaluador por fase.
   - **Validación empresarial:** concepto final emitido por el representante.

---

### 3.3 Gestión de Empresas

**Ruta:** `Empresas` en la barra de navegación.

#### Ver listado de empresas

- Tabla con: ID, nombre, sector, representante, email y teléfono.
- Campo de búsqueda por nombre, sector, representante o teléfono.

#### Crear una empresa

1. Haz clic en **"Ir a crear empresa"**.
2. Completa el formulario:
   - Nombre de la empresa
   - Sector
   - Email de contacto
   - Teléfono
   - Representante asignado (usuario con rol Representante)
3. Guarda la información.

#### Editar una empresa

1. Haz clic en el ícono ✏️ **Editar** junto a la empresa.
2. Actualiza los campos necesarios y guarda.

#### Eliminar una empresa

1. Haz clic en el ícono 🗑️ **Eliminar** junto a la empresa.
2. Confirma la acción en el diálogo de confirmación.

> ⚠️ Esta acción **no se puede deshacer**.

---

### 3.4 Gestión de Usuarios

**Ruta:** `Usuarios` en la barra de navegación.

#### Ver listado de usuarios

- Tabla con: nombre (y ID), correo, rol y fecha de creación.
- Campo de búsqueda por nombre, correo o rol.
- Paginación de 8 usuarios por página.

#### Crear un usuario

1. Haz clic en **"Ir a crear usuario"**.
2. Completa el formulario:
   - **Nombre completo**
   - **Correo electrónico**
   - **Contraseña**
   - **Rol:** Coordinador, Participante, Evaluador o Representante
3. Guarda el usuario.

#### Editar un usuario

1. Haz clic en el ícono ✏️ **Editar** en la fila del usuario.
2. Modifica los campos que necesites (nombre, correo, rol).
3. Guarda los cambios.

#### Eliminar un usuario

1. Haz clic en el ícono 🗑️ **Eliminar** en la fila del usuario.
2. Confirma la acción.

> ⚠️ Esta acción **no se puede deshacer**.

---

### 3.5 Reportes

**Ruta:** `Reportes` en la barra de navegación.

El módulo de reportes permite generar y exportar información filtrada sobre los proyectos del sistema.

#### Aplicar filtros

Puedes combinar los siguientes filtros:

| Filtro | Descripción |
|---|---|
| **Empresa** | Filtra proyectos por la empresa vinculada |
| **Proyecto** | Acota a un proyecto específico |
| **Fase** | Filtra por fase del ciclo del proyecto (Co-creación, Acción, Medición, Iteración, Narrativa, Apropiación) |
| **Estado** | Filtra por estado: Pendiente, En progreso, Completado, Cancelado |
| **Rango de fechas** | Define una fecha de inicio y fin para la consulta |

#### Previsualizacion

1. Configura los filtros deseados.
2. Haz clic en **"Aplicar filtros"**.
3. Verás una tabla con los proyectos que cumplen los criterios, mostrando: empresa, proyecto, fases, estado, fechas y usuarios involucrados.
4. El panel superior mostrará el conteo de proyectos, empresas y fases incluidas.

#### Descargar reporte

1. Con los filtros aplicados, haz clic en **"Descargar Excel"**.
2. Se descargará un archivo `.xls` con el nombre `reporte-livinglab-FECHA.xls`.

#### Limpiar filtros

- Haz clic en **"Limpiar filtros"** para reiniciar todos los campos y empezar una nueva consulta.

> 💡 Si no aplicas filtros, el botón "Descargar Excel" exportará **todos los proyectos** del sistema.

---

## 4. Rol: Participante

El Participante es el miembro del equipo académico asignado a ejecutar un proyecto. Su función principal es **registrar evidencias** del trabajo realizado en cada fase.

### 4.1 Panel de control (Dashboard)

Al iniciar sesión, verás:

- Saludo de bienvenida con tu nombre y la fecha.
- **Tarjetas KPI:**
  - Proyectos activos
  - Proyectos finalizados
  - Evidencias pendientes
  - Evaluaciones pendientes
- **Resumen rápido** y **actividad reciente**.

---

### 4.2 Mis Proyectos

**Ruta:** `Proyectos` en la barra de navegación.

#### Ver proyectos asignados

- Solo verás los proyectos que te han sido asignados por el Coordinador.
- La tabla muestra: ID, empresa, título, descripción del problema, resultado esperado, estado y fechas.
- Puedes buscar por título, empresa, problema o estado.

#### Ver detalle de un proyecto

1. Haz clic en **"Ver proyecto"** en la fila del proyecto.
2. Verás el encabezado del proyecto con: empresa, representante y fase actual.
3. Una barra de progreso indica el avance general del proyecto.

**Pestañas disponibles:**

#### Pestaña: Información

Muestra los datos generales:
- Título, empresa, estado y fechas.
- Descripción del problema y resultado esperado.
- Equipo del proyecto (participante y evaluador asignados).

#### Pestaña: Fases

Muestra la **ruta de fases** del proyecto en una tabla:

| Columna | Descripción |
|---|---|
| Orden | Número de la fase (F1, F2...) |
| Fase | Nombre de la fase |
| Flujo | Estado de flujo: Activa, Completada, Bloqueada, etc. |
| Estado | Estado de la fase |
| Evidencias | Cantidad de evidencias registradas |
| Observaciones | Notas del evaluador sobre la fase |

También verás la **retroalimentación del evaluador**: observaciones y checklists completados por fase.

#### Pestaña: Evidencias *(acción principal)*

Esta es la sección donde **registras tu trabajo**.

**Subir una nueva evidencia:**

1. La **fase** se asigna automáticamente (es la fase activa actual, no puedes cambiarla).
2. Escribe un **título** descriptivo. Ejemplo: "Informe de avance".
3. Agrega una **descripción** breve de la evidencia.
4. Haz clic en **"Seleccionar archivo"** y elige el documento, imagen o archivo de soporte.
5. Haz clic en **"Registrar evidencia"**.

> ⚠️ **Restricciones importantes:**
> - Solo puedes subir evidencias en la **fase activa actual**.
> - Si la **fecha de finalización** del proyecto ya pasó, no podrás registrar nuevas evidencias. Contacta al Coordinador.

**Ver evidencias registradas:**

En la parte inferior verás el historial de entregas con: fase, título, usuario, estado, observaciones y enlace al archivo.

#### Pestaña: Validación empresarial

Puedes **consultar (solo lectura)** el concepto final emitido por el Representante de la empresa sobre el proyecto:
- Si el proyecto resolvió el problema
- Si la solución es aplicable
- Si generó valor para la organización
- Si la empresa desea implementarla
- Nombre del firmante, cargo, comentarios y firma adjunta

> Si el Representante aún no ha registrado la validación, verás un mensaje informativo.

---

## 5. Rol: Evaluador

El Evaluador es el responsable de **revisar las evidencias** subidas por el Participante, **diligenciar checklists** por fase y **validar el cierre** del proyecto.

### 5.1 Panel de control (Dashboard)

Al iniciar sesión verás:

- Saludo de bienvenida con fecha actual.
- **Tarjetas KPI:**
  - Proyectos activos
  - Proyectos finalizados
  - Evidencias pendientes
  - Evaluaciones pendientes
- Resumen rápido y actividad reciente.

---

### 5.2 Proyectos por evaluar

**Ruta:** `Proyectos` en la barra de navegación.

#### Ver proyectos asignados

- Solo verás los proyectos donde fuiste asignado como evaluador.
- La tabla muestra: ID, empresa, título, descripción del problema, estado, fecha fin y participante asignado.
- Puedes buscar por título, empresa, estado o nombre del participante.

#### Evaluar un proyecto

1. Haz clic en el botón **"Evaluar"** en la fila del proyecto.
2. Se abrirá el detalle del proyecto con las siguientes pestañas:

**Pestañas disponibles:**

#### Pestaña: Información

Datos generales del proyecto (solo lectura):
- Título, empresa, estado y fechas.
- Descripción del problema y resultado esperado.
- Equipo del proyecto.

#### Pestaña: Fases

Tabla con todas las fases del proyecto:
- Orden, nombre, flujo, estado, cantidad de evidencias y observaciones.

#### Pestaña: Evidencias *(acción principal de revisión)*

Aquí puedes revisar todos los archivos entregados por el Participante:

| Columna | Descripción |
|---|---|
| Fase | Fase a la que pertenece la evidencia |
| Título | Nombre dado por el participante |
| Descripción | Detalle de la entrega |
| Usuario | Quien subió la evidencia |
| Estado | Estado de revisión de la evidencia |
| Observaciones | Tus notas sobre la entrega |
| Archivo | Enlace para ver/descargar el archivo |

#### Pestaña: Evaluación *(acción principal de calificación)*

Aquí completas el **checklist de evaluación por fase**:

1. Selecciona la fase a evaluar.
2. Revisa los ítems del checklist.
3. Para cada ítem indica el **resultado** y agrega una **observación** si es necesario.
4. Puedes dejar **observaciones generales** de la fase.
5. Guarda la evaluación.

Cada fase evaluada mostrará un resumen con tus observaciones y los ítems completados.

> 💡 El sistema habilita automáticamente la **validación empresarial** cuando todas las fases han sido evaluadas y el progreso del proyecto llega al 100%.

---

## 6. Rol: Representante

El Representante es la persona de la empresa aliada que **realiza la validación empresarial final** del proyecto, confirmando si la solución desarrollada cumple las expectativas de la organización.

### 6.1 Panel de control (Dashboard)

Al iniciar sesión verás:

- Saludo con tu nombre y el nombre de tu empresa.
- **Tarjetas KPI:**
  - Proyectos de la empresa
  - Validaciones pendientes
  - Validaciones completadas
- **Validaciones pendientes:** lista rápida de proyectos que requieren tu acción (clic para ir directo al proyecto).
- **Proyectos asociados:** todos los proyectos de tu empresa con su estado de validación.

---

### 6.2 Proyectos de la empresa

**Ruta:** `Proyectos` en la barra de navegación.

#### Ver proyectos

- Solo verás los proyectos vinculados a **tu empresa**.
- La tabla muestra: ID, empresa, título, estado, progreso (%), estado de validación empresarial y fecha fin.

**Estados de validación:**

| Estado | Significado |
|---|---|
| `No habilitada` | El proyecto aún está en progreso; debes esperar. |
| `Pendiente` | El proyecto está listo para que realices la validación. |
| `Completada` | Ya registraste o actualizaste la validación. |

#### Acceder al detalle de un proyecto

- Si la validación está **pendiente**: el botón dirá **"Validar"** y te llevará directamente a la pestaña de validación.
- Si la validación **no está habilitada**: el botón dirá **"Ver detalle"** (solo consulta).

---

### 6.3 Detalle del proyecto y Validación empresarial

Al ingresar al detalle verás:

**Pestañas disponibles:**

#### Pestaña: Información

Datos generales del proyecto (solo lectura):
- Título, empresa, estado y fechas.
- Descripción del problema y resultado esperado.
- Equipo del proyecto: participante, evaluador y representante.

#### Pestaña: Fases

Tabla con el estado de cada fase del proyecto (solo lectura):
- Orden, nombre, flujo, estado, evidencias y observaciones.

#### Pestaña: Evidencias

Consulta en **modo solo lectura** los archivos subidos por el Participante:
- Fase, título, descripción, usuario, estado, observaciones y enlace al archivo.

#### Pestaña: Evaluación

Consulta en **modo solo lectura** las evaluaciones del Evaluador por fase:
- Observaciones generales y checklists diligenciados por fase.

#### Pestaña: Validación empresarial *(acción principal)*

Esta es la sección donde **emites el concepto final** de la empresa sobre el proyecto.

**¿Cuándo se habilita?**

La validación se habilita automáticamente cuando:
- El proyecto alcanza el **100% de progreso**, o
- El evaluador marca el proyecto como **listo para cierre**.

**Cómo completar la validación:**

1. Responde las preguntas del formulario:

| Pregunta | Opciones |
|---|---|
| ¿El proyecto resolvió el problema? | Sí / Parcial / No |
| ¿La solución es aplicable? | Sí / No |
| ¿Generó valor para la organización? | Sí / No |
| ¿Desea implementar la solución? | Sí / No |

2. Ingresa el **nombre del firmante** (quien autoriza la validación).
3. Ingresa el **cargo** del firmante.
4. Agrega **comentarios** opcionales sobre el impacto o implementación.
5. Adjunta la **firma de la empresa** (imagen, PDF o documento firmado).
6. Haz clic en **"Guardar validación"**.

> ✅ Una vez guardada, puedes **actualizar** la validación si necesitas corregir información haciendo clic en **"Actualizar validación"**.

**Panel de estado (parte superior):**

Antes del formulario verás un resumen informativo:
- ¿El proyecto está listo para cierre? (Sí/No)
- ¿La validación ya fue registrada? (Sí/No)
- Porcentaje de progreso actual del proyecto

---

## 7. Flujo general del sistema

```
Coordinador crea empresa
       │
       ▼
Coordinador crea usuarios (Participante, Evaluador, Representante)
       │
       ▼
Coordinador crea proyecto y asigna empresa + equipo
       │
       ▼
Participante sube evidencias por fase activa
       │
       ▼
Evaluador revisa evidencias y completa checklists por fase
       │
       ▼
Sistema habilita la validación empresarial (100% progreso)
       │
       ▼
Representante completa la validación empresarial final
       │
       ▼
Coordinador genera reporte y exporta a Excel
```

### Fases del ciclo de un proyecto

Los proyectos siguen un ciclo de fases predefinido:

| # | Fase | Descripción |
|---|---|---|
| 1 | **Co-creación** | Definición conjunta del problema y la solución |
| 2 | **Acción** | Implementación y desarrollo de la solución |
| 3 | **Medición** | Evaluación de resultados y métricas |
| 4 | **Iteración** | Ajustes y mejoras basadas en resultados |
| 5 | **Narrativa** | Documentación y comunicación del proceso |
| 6 | **Apropiación** | Transferencia y apropiación de la solución |

Cada fase debe completarse en orden. Una fase se desbloquea cuando la anterior ha sido finalizada por el evaluador.

---

## 8. Preguntas frecuentes

**¿Qué hago si no puedo iniciar sesión?**
> Contacta al Coordinador para que verifique tus credenciales o restablezca tu contraseña.

**¿Puedo subir evidencias en cualquier fase?**
> No. El sistema solo permite subir evidencias en la **fase activa actual**. Las fases anteriores quedan bloqueadas.

**¿Qué pasa si el proyecto ya venció (fecha de fin pasada)?**
> No podrás registrar nuevas evidencias. Contacta al Coordinador para que actualice la fecha de fin del proyecto.

**¿Cuándo se habilita la validación empresarial?**
> Se habilita automáticamente cuando el evaluador completa todas las fases y el progreso del proyecto llega al **100%**.

**¿Puedo editar una validación empresarial ya registrada?**
> Sí. El Representante puede actualizar la validación en cualquier momento mientras el sistema la tenga activa.

**¿El Coordinador puede ver todo lo que hacen los demás roles?**
> Sí. El Coordinador tiene acceso completo a todos los proyectos, usuarios, empresas, evidencias, evaluaciones y reportes.

**¿Cómo sé en qué fase está mi proyecto?**
> En el detalle del proyecto (pestaña **Fases**) verás el estado de cada fase. La fase con estado **activa** o **en progreso** es la que corresponde trabajar actualmente.

**¿Puedo eliminar una evidencia ya subida?**
> No. Las evidencias son registros permanentes. Si hay un error, contacta al Coordinador.

---

*Manual generado para el sistema LivingLab · Última actualización: Abril 2026*
