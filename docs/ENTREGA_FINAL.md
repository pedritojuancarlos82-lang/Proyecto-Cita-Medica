# Montepiedra Salud — Documento de Entrega Final del Proyecto
## Hito 4: Cierre Técnico, Congelamiento de Producción y Puesta en Marcha al 100%

---

## 1. Resumen Ejecutivo

**Montepiedra Salud** es una plataforma integral SaaS y red asistencial multisede diseñada para optimizar la gestión de consultas médicas, agendamiento web sin fricción, expedientes clínicos electrónicos ligeros y liquidación financiera descentralizada en la ciudad de Guayaquil, Ecuador.

A lo largo de **5 semanas de ingeniería de software**, el equipo ha cumplido al **100%** los requerimientos de la matriz oficial distribuidos en **4 Hitos Fundamentales**:
1. **Hito 1 (Semanas 1 y 2):** Motor de calendario multisede, prevención algorítmica de traslapes y cálculo dinámico de tiempos de viaje entre sedes (Ceibos, Alborada, Mapasingue y Hospital Ceibos).
2. **Hito 2 (Semana 3):** Portal del Paciente con agendamiento en 4 pasos, validación algorítmica de cédula ecuatoriana (Módulo 10), pase con Código QR inmutable y pasarela de cobro transparente (descuento del 9.75% por pago directo).
3. **Hito 3 (Semana 4):** Portal Clínico del Dr. Carlos Campoverde con expediente cronológico SOAP optimizado para móvil (390x844px), emisión de recetas oficiales PDF con código MSP-REG-84729, notificaciones automatizadas y registro de gastos deducibles.
4. **Hito 4 (Semana 5):** Motor de liquidación semanal con retenciones por consultorio, tablero ejecutivo contable para la contadora, flujo de relevos médicos ante guardias hospitalarias, manual de usuario interactivo multi-rol y congelamiento para producción.

---

## 2. Matriz de Cumplimiento Técnico por Integrante (25% cada uno)

| Integrante / Rol | Ponderación | Responsabilidades Principales y Entregables Cumplidos |
|---|:---:|---|
| **Coordinación General y UI/UX** | **25%** | • Arquitectura del sistema de diseño basado en la regla cromática 60-30-10 (Neutros Slate, Azul Cobalto y Acentos Esmeralda/Ámbar).<br>• Diseño responsive mobile-first optimizado para celulares táctiles (390x844px) con viewport safe-area y touch targets ergonómicos de 44px.<br>• Implementación de transiciones entre vistas sin parpadeo.<br>• Creación del **Manual de Usuario Interactivo Multi-Rol** (`#modal-manual-usuario`) con navegación por pestañas y acciones rápidas de 1-clic para Paciente, Médico y Contadora.<br>• Botón técnico de **Restablecimiento de Datos Demostración** (`#btn-footer-reset-demo`). |
| **Jorge**<br>*(Agenda y Notificaciones)* | **25%** | • Motor de agendamiento multisede con resolución de colisiones y cálculo de tiempos de amortiguamiento de traslado (*travel buffers*).<br>• Detección de traslapes en salas físicas compartidas y turnos de urgencia.<br>• Servicio de automatización de correos electrónicos (`email-service.js`): confirmación inmediata de citas y recordatorios 24h previos.<br>• Mecanismo ágil de **Relevo Médico Entre Colegas** ante convocatorias de guardias imprevistas (Dra. Elena Morales, Dr. Roberto Noboa) con notificación automática a los pacientes.<br>• Panel de **Alertas Operativas del Sistema** en tiempo real (alergias severas, tráficos ajustados y citas por confirmar). |
| **Sebastián**<br>*(Módulo Clínico)* | **25%** | • Modelo de datos del expediente clínico electrónico y sincronización en tiempo real con **Supabase**.<br>• Expediente médico cronológico móvil con notas de evolución bajo estructura **SOAP** (Subjetivo, Objetivo, Análisis, Plan).<br>• Generador final de **Recetas Médicas Oficiales en PDF** en formato Media Carta / A5 con márgenes precisos `[8, 8, 8, 8]` y código profesional homologado (`MSP-REG-84729`).<br>• Integración de Código QR dinámico de autenticación y validación legal de recetas.<br>• Optimización asíncrona mediante objetos Blob con revocación de URLs (`URL.revokeObjectURL`) para evitar fugas de memoria en navegadores móviles.<br>• Visor e historial de prescripciones emitidas con botón directo de re-descarga. |
| **Isaac**<br>*(Finanzas y Contabilidad)* | **25%** | • Reglas financieras de comisiones y retenciones contractuales por consultorio: Clínica Ceibos (**25%**), Consultorio Alborada (**10%**), Consultorio Mapasingue (**5%**) y Hospital Público (**0%**).<br>• Política de descuento comercial transparente del **9.75%** para pagos en efectivo o transferencia bancaria.<br>• Módulo de rendición de gastos en ruta (combustibles, peajes, parqueos e insumos) con estricto control de comprobantes SRI y fechas límite.<br>• **Motor de Liquidación Semanal** de los viernes con generación de actas de retención.<br>• **Tablero Contable Ejecutivo** con 4 tarjetas de balance de caja, flujo clasificado por método de pago y exportación a formato CSV.<br>• Conciliación anual de cierre y generación de borrador para el **Formulario SRI 102**. |

---

## 3. Credenciales y Datos Semilla de Prueba (Demo Seeds)

La plataforma cuenta con un panel de autofill instantáneo de 1-clic en el modal de inicio de sesión (`#modal-unified-login`) y datos precargados para auditoría:

### A. Perfiles de Usuario para Evaluación

| Rol | Usuario / Identificador | Contraseña | Nombre Oficial / Detalles |
|---|---|---|---|
| **Paciente** | `paciente` *(o cédula `0987654321`)* | `paciente123` | **Carlos Mendoza Moreira**<br>• Ficha médica activa<br>• Alergia severa registrada: *Penicilina y Sulfas*<br>• Citas programadas en Clínica Ceibos y Consultorio Alborada |
| **Médico Titular** | `doctor` | `admin123` | **Dr. Carlos Campoverde**<br>• Especialidad: Medicina General & Preventiva<br>• Registro Profesional MSP: `MSP-REG-84729`<br>• Consultorio Ceibos #2, Mapasingue #1A, Alborada #4 |
| **Contadora / Auditora** | `contador` | `contador123` | **Lcda. Patricia Morales**<br>• Auditora Contable Externa<br>• Registro Profesional: `MSP-REG-CONT-0921`<br>• Acceso a conciliación SRI y liquidaciones semanales |

### B. Médicos de Cobertura y Relevo Homologados
- **Dra. Elena Morales:** `MSP-REG-092834` • Medicina Familiar y Comunitaria (+593 98 471 9283)
- **Dr. Roberto Noboa:** `MSP-REG-049281` • Medicina Interna (+593 99 123 4567)
- **Dra. Sofía Valdivieso:** `MSP-REG-103928` • Medicina General y Pediatría (+593 97 888 2211)

### C. Red de Sedes y Consultorios Médicos

| Sede | Dirección en Guayaquil | Tipo de Consultorio | Tarifa Lista | Tarifa Efectivo | Retención Sede |
|---|---|---|:---:|:---:|:---:|
| **Clínica Ceibos** | Av. del Bombero, Edif. Ceibos Plaza, Piso 3 (Cons. 2) | Privado Especializado | $21.95 | $20.00 | **25%** ($5.00) |
| **Consultorio Mapasingue** | Av. Primera y Calle 3ra, Mapasingue Oeste (Cons. 1A) | Privado General | $21.95 | $20.00 | **5%** ($1.00) |
| **Consultorio Alborada** | Av. Rodolfo Baquerizo Nazur, Alborada Etapa 8 (Cons. 4) | Tarifa Comunitaria | $21.95 | $20.00 | **10%** ($2.00) |
| **Hospital Público Ceibos** | Vía a la Costa km 6.5, Sala de Triaje | Servicio Público | $0.00 | $0.00 | **0%** ($0.00) |

---

## 4. Guía Rápida de Despliegue y Ejecución

### Opción 1: Ejecución Local con Servidor Python
```bash
# 1. Clonar el repositorio
git clone https://github.com/pedritojuancarlos82-lang/Proyecto-Cita-Medica.git
cd Proyecto-Cita-Medica

# 2. Levantar servidor local
python server.py
# o alternativamente:
npm start

# 3. Abrir en el navegador:
# http://localhost:8000
```

### Opción 2: Ejecución Directa Offline (Sin Servidor)
- Abrir directamente [`index.html`](file:///c:/Users/AlumnosMTP/Desktop/Proyecto-Cita-Medica-main/index.html) en cualquier navegador moderno mediante protocolo `file:///`.
- Gracias al bundle autocontenido [`js/app.bundle.js`](file:///c:/Users/AlumnosMTP/Desktop/Proyecto-Cita-Medica-main/js/app.bundle.js), la plataforma funciona al 100% sin necesidad de servidor HTTP ni dependencias de Node en tiempo de ejecución.

### Opción 3: Despliegue en GitHub Pages (Producción)
- **URL Oficial:** `https://pedritojuancarlos82-lang.github.io/Proyecto-Cita-Medica/`
- Todas las rutas relativas (`css/...`, `js/...`) y metadatos están normalizados para cargar limpiamente en entornos de subdirectorio.

### Opción 4: Compilación y Pruebas Automatizadas
```bash
# Re-empaquetar el bundle de producción
python build_bundle.py

# Ejecutar suite de pruebas unitarias del backend (28 pruebas)
python -m unittest discover -s backend -v
```

---

## 5. Arquitectura Técnica y Stack Tecnológico

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MONTEPIEDRA SALUD (SaaS)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
┌──────────────────┐    ┌──────────────────────┐    ┌───────────────────┐
│ PORTAL PACIENTE  │    │    PORTAL MÉDICO     │    │  PORTAL CONTABLE  │
│ • Wizard 4 Pasos │    │ • Agenda Intersedes  │    │ • Balance de Caja │
│ • Pase QR Legal  │    │ • SOAP Móvil         │    │ • Liquidación 5W  │
│ • Descuento 9.75%│    │ • Recetas PDF (MSP)  │    │ • Conciliación SRI│
│ • Mis Citas/Ficha│    │ • Relevos de Guardia │    │ • Gastos en Ruta  │
└─────────┬────────┘    └──────────┬───────────┘    └─────────┬─────────┘
          │                        │                          │
          └────────────────────────┼──────────────────────────┘
                                   │
                                   ▼
         ┌──────────────────────────────────────────────────┐
         │            ESTADO CENTRAL REACTIVO               │
         │  (StateStore en state.js / app.bundle.js)        │
         ├──────────────────────────────────────────────────┤
         │ • appointments        • reliefAssignments        │
         │ • medicalRecords      • systemAlerts             │
         │ • prescriptions       • settlements / expenses   │
         └─────────┬──────────────────────────────┬─────────┘
                   │                              │
                   ▼                              ▼
         ┌───────────────────┐          ┌───────────────────┐
         │    SUPABASE DB    │          │  HTML2PDF / QR    │
         │ • Postgres        │          │ • Comprobante QR  │
         │ • Realtime Sync   │          │ • Receta A5 PDF   │
         └───────────────────┘          └───────────────────┘
```

- **Frontend Core:** HTML5 Semántico, JavaScript ES6+ Modular unificado, CSS3 Vanilla con Custom Properties y tipografías premium (Outfit, Space Grotesk, Inter y JetBrains Mono).
- **Librerías Cliente:**
  - `QRCode.js`: Generación de códigos QR vectoriales in situ de alta densidad.
  - `html2pdf.js`: Motor de exportación a PDF para Media Carta / A5 con márgenes de grado médico.
  - `@supabase/supabase-js v2`: Conexión opcional a base de datos Postgres en la nube con suscripción en tiempo real.
- **Backend & QA Suite:** Python 3.12 con módulo `unittest` que valida:
  - Políticas de cancelación y sobrecupo.
  - Prevención de traslapes en salas físicas compartidas.
  - Cálculo de tiempos de amortiguamiento dinámicos (*travel buffers*).
  - Reglas de liquidación y deducción porcentual de honorarios por clínica.
  - Integridad criptográfica de tokens QR contra manipulaciones (*tampering*).

---

## 6. Dictamen de Calidad y Cierre de Producción

| Criterio de Control | Estado | Observación |
|---|:---:|---|
| **Errores en Consola** | **0 ERRORES** | Consola limpia sin logs de depuración ruidosos. |
| **Sintaxis de Código** | **0 ERRORES** | Verificado con `node --check` en el 100% de los archivos `.js`. |
| **Pruebas Unitarias** | **28 / 28 PASADAS** | 100% de cobertura en módulos críticos (tiempo de ejecución: 0.04s). |
| **Compatibilidad Móvil** | **APROBADO** | Validado en viewport estándar de 390x844px sin desbordamientos. |
| **Navegación sin Parpadeos** | **APROBADO** | Transición instantánea entre los 4 portales principales. |
| **Hito 4: Puesta en Producción** | **CONGELADO 100%** | Código listo para entrega formal y despliegue final. |

*Firma del Equipo de Ingeniería:*  
**Lead Release Engineer & DevOps Specialist — Montepiedra Salud 2026**
