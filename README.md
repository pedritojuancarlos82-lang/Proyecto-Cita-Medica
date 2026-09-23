# Plataforma Integral de Gestión y Atención Médica (SaaS Médico Multisede)

Prototipo UI/UX v1 de una plataforma médica multisede orientada a conectar en tiempo real a pacientes, médicos itinerantes en ruta y auditoría contable sin fricciones ni cruces de horarios.

---

## 🚀 Módulos y Arquitectura del Sistema

### 1. Landing Page & Login Unificado Central (Página 1)
- **Cabecera Institucional**: Logotipo con distintivo oficial de **Medicina General** y botón de consulta directa de turno.
- **Selector de Perfil Reactivo (Pills)**: Conmutador de 3 posiciones para alternar entre `[Médico Titular]`, `[Paciente / Cliente]` y `[Contabilidad Externa]`.
- **Formulario de Ingreso**: Cédula o correo, visualizador de clave (icono de ojo) y checkbox de recordar sesión.
- **Barra de Acceso Rápido Demo (1 Clic)**: Botones para autorelleno de credenciales de prueba.
- **Acceso Rápido por Código QR**: Simulación de lectura de tarjeta física para pacientes.
- **Insignias de Confianza**: Cifrado SSL 256-bit y aviso de emergencia vital hospitalaria.

### 2. Portal de Citas del Paciente (Flujo en 4 Pasos - Página 3)
1. **Elección de Sede**: Tarjetas con tarifas fijas y fotos reales:
   - **Clínica Ceibos** ($20.00)
   - **Consultorio Mapasingue** ($20.00)
   - **Consultorio Alborada** ($10.00)
   - **Hospital Público Ceibos** ($0.00 / Gratuito)
2. **Fecha y Hora**: Calendario interactivo con pills de horarios disponibles (30 y 45 min) y bloqueo automático de franjas de traslado del doctor.
3. **Datos y Método de Pago Transparente**: Desglose claro del recargo bancario del **9.75%** por tarjeta antes de finalizar ($20.00 + $1.95 = $21.95).
4. **Ticket y Confirmación**: Tarjeta oficial con código QR vectorial SVG interactivo, código alfanumérico `#MED-XXXXX`, descarga de comprobante en PDF e impresión.

### 3. Portal Médico Mobile-First (Xiaomi Redmi Note 390x844px - Página 4)
- **Cronograma Diario y Rutas**: Línea de tiempo vertical con tarjetas por hora y consultorios.
- **Bloques de Traslado Protegido**: Franjas distintivas en color ámbar entre citas (ej. `🚗 En traslado de Alborada hacia Ceibos (45 min)`).
- **Botón de Guardia de Emergencia (FAB Rojo)**: Asistente con 1 toque para reagendar automáticamente citas al siguiente día hábil o cancelarlas por fuerza mayor.
- **Barra Inferior Móvil (4 Iconos)**:
  - `[Agenda]`: Cronograma y filtros de consultorio.
  - `[Fichas]`: Buscador reactivo de historial clínico, antecedentes y alerta de alergias críticas (Penicilina).
  - `[Recetas]`: Generador de recetas médicas oficiales con código MSP (`MSP-REG-84729`), salida PDF y botón para compartir por WhatsApp.
  - `[Gastos]`: Registro de gastos en 2 toques con presets: Taxi ($4.00), Gasolina ($15.00), Insumos de Hospital ($12.00) y teclado para otros conceptos.

### 4. Panel Administrativo de la Contadora (Página 5)
- **Fila de 4 KPIs**: Total Ingresos Brutos, Retenciones por Sedes, Gastos Operativos Acumulados e Ingreso Neto Real.
- **Liquidación de los Viernes**: Corte de caja automático con retenciones del **5%** (Mapasingue), **25%** (Ceibos) y **10%** (Alborada), sueldo fijo mensual del hospital público ($1,200.00) y badges de estado `[Liquidado]` y `[Pendiente de Facturación]`.
- **Rentabilidad Real por Sede**: Comparativa gráfica de márgenes netos entre consultorios.
- **Clasificador Contable**: Egresos en Transporte, Mantenimiento, Suministros Hospital y Activos.
- **Exportación Tributaria SRI**: Descarga de balance en formato CSV compatible con Microsoft Excel y vista previa formal para declaración tributaria.

---

## 🎨 Paleta Cromática Funcional

| Color | Código Hex | Uso |
| :--- | :--- | :--- |
| **Azul Clínico Principal** | `#0284c7` | Cabeceras, botones primarios, citas de Mapasingue |
| **Azul Marino Oscuro** | `#0f172a` | Texto principal, h1/h2, barras de navegación |
| **Verde Éxito / Alborada** | `#10b981` | Turnos en Alborada, confirmación de reserva y pago |
| **Índigo Ceibos** | `#6366f1` | Citas y liquidaciones en Clínica de Ceibos |
| **Naranja Hospital / Traslado** | `#f59e0b` | Atención pública y bloques de tiempo de traslado |
| **Rojo Guardia / Cancelado** | `#ef4444` | Botón flotante de emergencia y citas canceladas |

---

## 🔑 Credenciales Demostrativas

| Rol | Usuario / Cédula | Clave | Acceso Principal |
| :--- | :--- | :--- | :--- |
| **Médico Titular (Dr. Carlos Campoverde)** | `doctor` / `0930860044` | `admin123` | Agenda, traslados, fichas, recetario PDF y guardia |
| **Paciente** | `paciente` / `0987654321` | `paciente123` | Reserva en 4 pasos, ticket QR, desglose 9.75% |
| **Contadora** | `contador` / `0912345678` | `contador123` | Liquidación de viernes, retenciones y balance SRI |

---

## 💻 Ejecución Local

Para levantar el proyecto en un entorno local:

```bash
# Con Python:
python -m http.server 8080

# Abrir en el navegador:
http://localhost:8080/
```
