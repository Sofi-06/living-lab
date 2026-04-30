-- ============================================================
--  DATOS DE PRUEBA — Sistema LivingLab
--  Base de datos: camina_db (MySQL 8)
--  Generado: Abril 2026
-- ============================================================
--
--  NOTA SOBRE CONTRASEÑAS:
--  El sistema autentica con bcryptjs. Sin embargo, el backend
--  detecta si la contraseña es texto plano y la convierte a
--  hash automáticamente en el primer inicio de sesión.
--  Por lo tanto, los inserts usan contraseñas en texto plano.
--
--  CREDENCIALES DE ACCESO (para pruebas):
--  ┌─────────────────────────────────────┬─────────────────┬───────────────┐
--  │ Correo                              │ Contraseña      │ Rol           │
--  ├─────────────────────────────────────┼─────────────────┼───────────────┤
--  │ carlos.mendoza@livinglab.edu.co     │ Admin123        │ Coordinador   │
--  │ ana.torres@livinglab.edu.co         │ Participa2024   │ Participante  │
--  │ roberto.gomez@livinglab.edu.co      │ Evalua2024      │ Evaluador     │
--  │ mcastro@techsolutions.co            │ Empresa2024     │ Representante │
--  │ lucia.vargas@livinglab.edu.co       │ Participa2024   │ Participante  │
--  │ jorge.prada@livinglab.edu.co        │ Evalua2024      │ Evaluador     │
--  │ director@novaindustrias.co          │ Empresa2024     │ Representante │
--  └─────────────────────────────────────┴─────────────────┴───────────────┘
--
-- ============================================================

USE camina_db;

-- ============================================================
-- 1. USUARIOS
--    Orden de inserción: primero los Representantes (se
--    necesitan sus IDs para crear las empresas)
-- ============================================================

INSERT INTO users (name, email, password, role, createdAt, updatedAt) VALUES
-- Coordinador
('Carlos Mendoza',         'carlos.mendoza@livinglab.edu.co', 'Admin123',       'COORDINADOR',   NOW(), NOW()),

-- Representantes (van antes que las empresas)
('María Fernanda Castro',  'mcastro@techsolutions.co',        'Empresa2024',    'REPRESENTANTE', NOW(), NOW()),
('Jorge Andrés Director',  'director@novaindustrias.co',      'Empresa2024',    'REPRESENTANTE', NOW(), NOW()),

-- Participantes
('Ana Sofía Torres',       'ana.torres@livinglab.edu.co',     'Participa2024',  'PARTICIPANTE',  NOW(), NOW()),
('Lucía Vargas Ruiz',      'lucia.vargas@livinglab.edu.co',   'Participa2024',  'PARTICIPANTE',  NOW(), NOW()),

-- Evaluadores
('Roberto Gómez Peña',     'roberto.gomez@livinglab.edu.co',  'Evalua2024',     'EVALUADOR',     NOW(), NOW()),
('Jorge Prada Suárez',     'jorge.prada@livinglab.edu.co',    'Evalua2024',     'EVALUADOR',     NOW(), NOW());

-- IDs resultantes:
--   1 = Carlos Mendoza       (COORDINADOR)
--   2 = María Fernanda Castro (REPRESENTANTE)
--   3 = Jorge Andrés Director (REPRESENTANTE)
--   4 = Ana Sofía Torres      (PARTICIPANTE)
--   5 = Lucía Vargas Ruiz     (PARTICIPANTE)
--   6 = Roberto Gómez Peña    (EVALUADOR)
--   7 = Jorge Prada Suárez    (EVALUADOR)


-- ============================================================
-- 2. FASES DEL SISTEMA
--    Estas son las 6 fases del ciclo LivingLab.
--    Deben existir antes de crear los ProjectPhase.
-- ============================================================

INSERT INTO phases (nombre) VALUES
('Co-creacion'),   -- id 1
('Accion'),        -- id 2
('Medicion'),      -- id 3
('Iteracion'),     -- id 4
('Narrativa'),     -- id 5
('Apropiacion');   -- id 6


-- ============================================================
-- 3. EMPRESAS ALIADAS
--    representanteId → FK a users.id (debe ser REPRESENTANTE)
-- ============================================================

INSERT INTO companies (nombre, sector, email, telefono, representanteId) VALUES
('Tech Solutions Colombia', 'Tecnología e Innovación',    'contacto@techsolutions.co',  '6015551234', 2),
('Nova Industrias S.A.S.',  'Manufactura y Producción',   'director@novaindustrias.co', '6015559876', 3);

-- IDs resultantes:
--   1 = Tech Solutions Colombia  (representante: María Fernanda Castro, id=2)
--   2 = Nova Industrias S.A.S.   (representante: Jorge Andrés Director, id=3)


-- ============================================================
-- 4. PROYECTOS
--    Escenario A: Proyecto completado con validación
--    Escenario B: Proyecto en progreso (sin validación aún)
--    Escenario C: Proyecto pendiente (recién creado)
-- ============================================================

INSERT INTO projects (companyId, participanteId, evaluadorId, titulo, descripcionProblema, resultadoEsperado, estado, fechaInicio, fechaFin) VALUES

-- Proyecto 1: COMPLETADO — Tech Solutions / Ana / Roberto
(1, 4, 6,
 'Plataforma de Gestión de Inventarios Inteligente',
 'La empresa no cuenta con un sistema centralizado para el control de inventarios, lo que genera pérdidas de productos, desabastecimiento frecuente y tiempos de respuesta lentos en el área de logística.',
 'Desarrollar un prototipo funcional de plataforma web que permita registrar, consultar y alertar sobre los niveles de inventario en tiempo real, reduciendo en un 30% los errores de gestión.',
 'COMPLETED',
 '2026-01-10', '2026-03-28'),

-- Proyecto 2: EN PROGRESO — Tech Solutions / Lucía / Jorge
(1, 5, 7,
 'Sistema de Atención al Cliente con IA Conversacional',
 'El área de servicio al cliente recibe un volumen alto de solicitudes repetitivas que saturan al equipo humano, generando tiempos de espera superiores a 48 horas y baja satisfacción del usuario.',
 'Diseñar e implementar un chatbot entrenado con las preguntas frecuentes de la empresa, capaz de resolver el 60% de las consultas sin intervención humana y derivar el resto al equipo apropiado.',
 'IN_PROGRESS',
 '2026-02-05', '2026-05-30'),

-- Proyecto 3: PENDIENTE — Nova Industrias / Ana / Roberto
(2, 4, 6,
 'Optimización de Línea de Producción mediante Sensores IoT',
 'La línea de producción opera sin monitoreo en tiempo real, lo que impide detectar fallos tempranos en maquinaria y provoca paradas no planificadas con costos elevados.',
 'Implementar un sistema de sensores IoT conectados a un dashboard web que muestre el estado de las máquinas en tiempo real y envíe alertas preventivas al equipo de mantenimiento.',
 'PENDING',
 '2026-04-01', '2026-07-15');

-- IDs resultantes:
--   1 = Plataforma de Inventarios (COMPLETED)
--   2 = Chatbot IA                (IN_PROGRESS)
--   3 = IoT Producción            (PENDING)


-- ============================================================
-- 5. FASES POR PROYECTO (project_phases)
--    Proyecto 1 (COMPLETED): todas las fases completadas
--    Proyecto 2 (IN_PROGRESS): 3 fases completadas, 1 activa
--    Proyecto 3 (PENDING): todas las fases en pendiente
-- ============================================================

-- ── Proyecto 1: Plataforma de Inventarios (COMPLETADO) ──────
INSERT INTO project_phases (projectId, phaseId, estado, observaciones) VALUES
(1, 1, 'COMPLETED', 'Co-creación exitosa. Se identificaron los módulos de entrada, salida y alertas con el equipo de Tech Solutions.'),
(1, 2, 'COMPLETED', 'Acción completada. Prototipo funcional entregado y probado en el ambiente de staging de la empresa.'),
(1, 3, 'COMPLETED', 'Medición finalizada. Las métricas muestran una reducción del 34% en errores de inventario, superando el objetivo.'),
(1, 4, 'COMPLETED', 'Iteración completada. Se incorporaron ajustes de usabilidad según el feedback de los usuarios finales.'),
(1, 5, 'COMPLETED', 'Narrativa documentada. Se elaboró el informe ejecutivo y el video de presentación del proyecto.'),
(1, 6, 'COMPLETED', 'Apropiación completada. El equipo de Tech Solutions fue capacitado y asumió la operación del sistema.');

-- ── Proyecto 2: Chatbot IA (EN PROGRESO) ─────────────────────
INSERT INTO project_phases (projectId, phaseId, estado, observaciones) VALUES
(2, 1, 'COMPLETED', 'Co-creación realizada. Se definieron los flujos conversacionales y las categorías de preguntas frecuentes con el área de atención al cliente.'),
(2, 2, 'COMPLETED', 'Acción completada. Chatbot desplegado en ambiente de pruebas, integrado con la plataforma de mensajería de la empresa.'),
(2, 3, 'IN_REVIEW',  'Medición en revisión. Se están recolectando las métricas de satisfacción del cliente tras el primer mes de operación.'),
(2, 4, 'PENDING',    NULL),
(2, 5, 'PENDING',    NULL),
(2, 6, 'PENDING',    NULL);

-- ── Proyecto 3: IoT Producción (PENDIENTE) ───────────────────
INSERT INTO project_phases (projectId, phaseId, estado, observaciones) VALUES
(3, 1, 'PENDING', NULL),
(3, 2, 'PENDING', NULL),
(3, 3, 'PENDING', NULL),
(3, 4, 'PENDING', NULL),
(3, 5, 'PENDING', NULL),
(3, 6, 'PENDING', NULL);

-- IDs de project_phases generados:
--   1  = P1-Co-creacion (COMPLETED)      7  = P2-Co-creacion (COMPLETED)
--   2  = P1-Accion      (COMPLETED)      8  = P2-Accion      (COMPLETED)
--   3  = P1-Medicion    (COMPLETED)      9  = P2-Medicion    (IN_REVIEW)
--   4  = P1-Iteracion   (COMPLETED)      10 = P2-Iteracion   (PENDING)
--   5  = P1-Narrativa   (COMPLETED)      11 = P2-Narrativa   (PENDING)
--   6  = P1-Apropiacion (COMPLETED)      12 = P2-Apropiacion (PENDING)
--                                        13..18 = P3 (todas PENDING)


-- ============================================================
-- 6. EVIDENCIAS
--    Subidas por el Participante (Ana = id 4, Lucía = id 5)
--    projectPhaseId → FK a project_phases.id
-- ============================================================

-- ── Evidencias del Proyecto 1 (Ana Sofía, userId=4) ─────────
INSERT INTO evidences (projectPhaseId, userId, titulo, descripcion, archivo, estado, observaciones, fecha) VALUES

-- Fase Co-creacion (project_phases.id = 1)
(1, 4, 'Acta de reunión inicial con Tech Solutions',
 'Documento que recoge los acuerdos, requerimientos y compromisos establecidos en la reunión de arranque del proyecto con el equipo de Tech Solutions.',
 '/uploads/p1-cocreacion-acta-reunion.pdf',
 'APPROVED', 'Documento completo y bien estructurado. Aprobado.', '2026-01-15 09:30:00'),

(1, 4, 'Mapa de procesos del área de logística',
 'Diagrama del flujo actual de gestión de inventarios, identificando los puntos críticos de falla y oportunidades de mejora.',
 '/uploads/p1-cocreacion-mapa-procesos.pdf',
 'APPROVED', 'Excelente análisis de proceso. Se aprueba.', '2026-01-22 14:00:00'),

-- Fase Accion (project_phases.id = 2)
(2, 4, 'Prototipo v1.0 - Demo en vídeo',
 'Grabación de la demo funcional del prototipo en el ambiente de staging. Se muestran los módulos de entrada, salida, consulta y alertas de inventario.',
 '/uploads/p1-accion-demo-v1.mp4',
 'APPROVED', 'Demo clara y completa. Prototipo aprobado para pruebas.', '2026-02-10 11:00:00'),

(2, 4, 'Manual de usuario básico del prototipo',
 'Guía rápida de uso del sistema para el equipo de logística de Tech Solutions.',
 '/uploads/p1-accion-manual-usuario.pdf',
 'APPROVED', 'Manual suficiente para la etapa de pruebas.', '2026-02-15 16:30:00'),

-- Fase Medicion (project_phases.id = 3)
(3, 4, 'Informe de métricas - Mes 1',
 'Análisis cuantitativo de los indicadores del sistema tras el primer mes de operación. Reducción de errores: 34%. Tiempo de respuesta logística: -22%.',
 '/uploads/p1-medicion-informe-mes1.pdf',
 'APPROVED', 'Resultados superan el objetivo planteado. Aprobado.', '2026-02-28 10:00:00'),

-- Fase Iteracion (project_phases.id = 4)
(4, 4, 'Lista de mejoras implementadas v1.1',
 'Documento técnico con los ajustes realizados tras el feedback de los usuarios: mejora en filtros, exportación a Excel y notificaciones por correo.',
 '/uploads/p1-iteracion-mejoras-v1-1.pdf',
 'APPROVED', 'Iteración bien documentada y ejecutada.', '2026-03-10 09:00:00'),

-- Fase Narrativa (project_phases.id = 5)
(5, 4, 'Informe ejecutivo final del proyecto',
 'Documento completo con el resumen ejecutivo, impacto generado, lecciones aprendidas y recomendaciones para la adopción definitiva del sistema.',
 '/uploads/p1-narrativa-informe-ejecutivo.pdf',
 'APPROVED', 'Excelente documento. Narrativa aprobada.', '2026-03-20 14:00:00'),

-- Fase Apropiacion (project_phases.id = 6)
(6, 4, 'Certificado de capacitación del equipo Tech Solutions',
 'Acta firmada por los 5 integrantes del equipo de logística confirmando la capacitación recibida y la transferencia del sistema.',
 '/uploads/p1-apropiacion-certificado-capacitacion.pdf',
 'APPROVED', 'Apropiación completada satisfactoriamente.', '2026-03-27 16:00:00');

-- ── Evidencias del Proyecto 2 (Lucía Vargas, userId=5) ──────
INSERT INTO evidences (projectPhaseId, userId, titulo, descripcion, archivo, estado, observaciones, fecha) VALUES

-- Fase Co-creacion (project_phases.id = 7)
(7, 5, 'Catálogo de preguntas frecuentes',
 'Listado validado de 120 preguntas frecuentes del área de atención al cliente, clasificadas por categoría y prioridad para entrenar el chatbot.',
 '/uploads/p2-cocreacion-faq-catalogo.xlsx',
 'APPROVED', 'Catálogo completo y bien organizado.', '2026-02-12 10:30:00'),

-- Fase Accion (project_phases.id = 8)
(8, 5, 'Chatbot desplegado - Capturas de pantalla',
 'Evidencia gráfica del chatbot operando en el canal de WhatsApp Business y en el sitio web de Tech Solutions. Se incluyen capturas de conversaciones de prueba.',
 '/uploads/p2-accion-capturas-chatbot.pdf',
 'APPROVED', 'Integración correcta. Se aprueba la fase de acción.', '2026-03-05 09:00:00'),

-- Fase Medicion (project_phases.id = 9)
(9, 5, 'Reporte parcial de satisfacción - Semana 1',
 'Primeras métricas de uso del chatbot: 847 conversaciones iniciadas, 58% resueltas sin intervención humana, tiempo promedio de respuesta: 12 segundos.',
 '/uploads/p2-medicion-reporte-semana1.pdf',
 'IN_REVIEW', NULL, '2026-04-10 11:00:00');


-- ============================================================
-- 7. CHECKLIST POR FASE (phase_checklist)
--    Diligenciado por los Evaluadores
--    Proyecto 1: todas las fases evaluadas (Roberto, id=6)
--    Proyecto 2: solo fases 1 y 2 evaluadas (Jorge, id=7)
-- ============================================================

-- ── Checklist Proyecto 1 — Co-creacion (pp.id = 1) ──────────
INSERT INTO phase_checklist (projectPhaseId, item, resultado, observacion) VALUES
(1, 'Se identificaron correctamente los actores clave del proyecto',         'CUMPLE',    'Todos los stakeholders documentados en el acta.'),
(1, 'El problema fue definido de manera clara y medible',                    'CUMPLE',    'Buena delimitación del alcance.'),
(1, 'Se establecieron los criterios de éxito del proyecto',                  'CUMPLE',    'Criterios cuantificables y realistas.'),
(1, 'El participante demostró comprensión del contexto empresarial',         'CUMPLE',    'Manejo adecuado del lenguaje técnico-empresarial.');

-- ── Checklist Proyecto 1 — Accion (pp.id = 2) ────────────────
INSERT INTO phase_checklist (projectPhaseId, item, resultado, observacion) VALUES
(2, 'El prototipo responde a los requerimientos definidos en co-creación',   'CUMPLE',    'Los módulos cumplen con lo acordado.'),
(2, 'El código o solución está documentado de manera básica',               'CUMPLE',    'Documentación suficiente para esta etapa.'),
(2, 'Se realizaron pruebas funcionales antes de la entrega',                 'CUMPLE',    NULL),
(2, 'El entregable fue presentado al equipo de la empresa',                  'CUMPLE',    'Demo ejecutada exitosamente el 10 de febrero.');

-- ── Checklist Proyecto 1 — Medicion (pp.id = 3) ──────────────
INSERT INTO phase_checklist (projectPhaseId, item, resultado, observacion) VALUES
(3, 'Se definieron indicadores de medición claros',                          'CUMPLE',    NULL),
(3, 'Los resultados superan el umbral de éxito acordado',                    'CUMPLE',    'Reducción del 34%, objetivo era 30%.'),
(3, 'Se incluyeron comparativas antes/después del sistema',                  'CUMPLE',    'Comparativa bien estructurada en el informe.'),
(3, 'El informe de métricas está respaldado con datos reales',               'CUMPLE',    NULL);

-- ── Checklist Proyecto 1 — Iteracion (pp.id = 4) ─────────────
INSERT INTO phase_checklist (projectPhaseId, item, resultado, observacion) VALUES
(4, 'Se recopiló feedback estructurado de los usuarios finales',             'CUMPLE',    '12 usuarios encuestados.'),
(4, 'Las mejoras implementadas responden al feedback recibido',              'CUMPLE',    NULL),
(4, 'La iteración fue documentada con comparativa de versiones',             'CUMPLE',    'Documento v1.0 vs v1.1 completo.'),
(4, 'El equipo de la empresa validó las mejoras',                            'CUMPLE',    'Validación firmada por el jefe de logística.');

-- ── Checklist Proyecto 1 — Narrativa (pp.id = 5) ─────────────
INSERT INTO phase_checklist (projectPhaseId, item, resultado, observacion) VALUES
(5, 'El informe ejecutivo comunica el impacto de forma clara',               'CUMPLE',    'Informe de alta calidad, apto para presentar a directivos.'),
(5, 'Se documentaron lecciones aprendidas del proceso',                      'CUMPLE',    NULL),
(5, 'El material es comprensible para personas no técnicas',                 'CUMPLE',    NULL);

-- ── Checklist Proyecto 1 — Apropiacion (pp.id = 6) ───────────
INSERT INTO phase_checklist (projectPhaseId, item, resultado, observacion) VALUES
(6, 'El equipo de la empresa recibió capacitación formal',                   'CUMPLE',    '5 personas capacitadas durante 2 sesiones de 3 horas.'),
(6, 'Existe un plan de sostenibilidad para el sistema',                      'CUMPLE',    'Plan de mantenimiento mensual acordado.'),
(6, 'La empresa puede operar el sistema sin apoyo del equipo académico',     'CUMPLE',    'Prueba de operación autónoma exitosa.'),
(6, 'Se firmó el acta de entrega formal del proyecto',                       'CUMPLE',    'Acta firmada por ambas partes el 27 de marzo.');

-- ── Checklist Proyecto 2 — Co-creacion (pp.id = 7) ───────────
INSERT INTO phase_checklist (projectPhaseId, item, resultado, observacion) VALUES
(7, 'Se identificaron correctamente los actores clave del proyecto',         'CUMPLE',    NULL),
(7, 'El problema fue definido de manera clara y medible',                    'CUMPLE',    'Excelente delimitación del volumen de solicitudes y tiempos de espera.'),
(7, 'Se establecieron los criterios de éxito del proyecto',                  'CUMPLE',    'Meta del 60% de resolución autónoma es alcanzable.'),
(7, 'El participante demostró comprensión del contexto empresarial',         'CUMPLE',    NULL);

-- ── Checklist Proyecto 2 — Accion (pp.id = 8) ────────────────
INSERT INTO phase_checklist (projectPhaseId, item, resultado, observacion) VALUES
(8, 'El prototipo responde a los requerimientos definidos en co-creación',   'CUMPLE',    'Chatbot integrado correctamente en ambos canales.'),
(8, 'El código o solución está documentado de manera básica',               'CUMPLE',    NULL),
(8, 'Se realizaron pruebas funcionales antes de la entrega',                 'CUMPLE',    'Pruebas con usuarios internos de Tech Solutions.'),
(8, 'El entregable fue presentado al equipo de la empresa',                  'CUMPLE',    NULL);


-- ============================================================
-- 8. SUMMARY CHECKLIST (Resumen por fase del evaluador)
--    Solo para el Proyecto 1 (completado)
-- ============================================================

INSERT INTO summary_checklist (projectId, fase, criterio, resultado, observacion) VALUES
(1, 'Co-creacion', 'Alineacion con el problema real de la empresa',    'CUMPLE',   'El equipo comprendió perfectamente la problemática de logística.'),
(1, 'Co-creacion', 'Participacion activa de la empresa en la fase',    'CUMPLE',   NULL),
(1, 'Accion',      'Calidad técnica del prototipo entregado',          'CUMPLE',   'Prototipo supera las expectativas para esta etapa.'),
(1, 'Accion',      'Cumplimiento de los plazos acordados',             'CUMPLE',   'Entrega a tiempo.'),
(1, 'Medicion',    'Solidez del análisis de resultados',               'CUMPLE',   'Métricas bien sustentadas con datos reales del sistema.'),
(1, 'Medicion',    'Cumplimiento del objetivo de impacto',             'CUMPLE',   'Se superó el 30% de mejora establecido como meta.'),
(1, 'Iteracion',   'Pertinencia de las mejoras implementadas',         'CUMPLE',   NULL),
(1, 'Narrativa',   'Calidad del informe ejecutivo final',              'CUMPLE',   'Informe listo para presentar al comité directivo.'),
(1, 'Apropiacion', 'Nivel de transferencia del conocimiento',          'CUMPLE',   'Equipo operando el sistema de forma autónoma.');


-- ============================================================
-- 9. VALIDACIÓN EMPRESARIAL (business_validation)
--    Solo para el Proyecto 1 (completado y validado)
--    Firmado por: María Fernanda Castro (representante)
-- ============================================================

INSERT INTO business_validation (projectId, resolvioProblema, esAplicable, generaValor, deseaImplementarla, comentarios, nombreFirmante, cargo, firma) VALUES
(1,
 'SI',
 'SI',
 'SI',
 'SI',
 'El sistema de gestión de inventarios desarrollado por el equipo de LivingLab superó nuestras expectativas. En el primer mes de operación real logramos reducir los errores de inventario en un 34% y el tiempo de respuesta del área de logística mejoró notablemente. El equipo fue profesional, comprometido y supo adaptar la solución a nuestras necesidades específicas. Definitivamente implementaremos el sistema en producción y evaluaremos la expansión a otras áreas de la empresa.',
 'María Fernanda Castro Ríos',
 'Directora de Operaciones',
 '/uploads/p1-validacion-firma-mfcastro.png');


-- ============================================================
--  FIN DEL SCRIPT
--  Resumen de registros insertados:
--    users              : 7
--    phases             : 6
--    companies          : 2
--    projects           : 3
--    project_phases     : 18  (6 por proyecto)
--    evidences          : 11  (8 del P1, 3 del P2)
--    phase_checklist    : 27  (P1: todas las fases, P2: fases 1 y 2)
--    summary_checklist  : 9   (solo P1)
--    business_validation: 1   (solo P1)
-- ============================================================
