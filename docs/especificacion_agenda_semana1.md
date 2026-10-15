# DOCUMENTO TÉCNICO DE ESPECIFICACIÓN DE REQUERIMIENTOS DE SOFTWARE (SRS)
## Módulo de Lógica de Agenda Multisede, Rotaciones y Ventanas de Traslado
**Proyecto:** Plataforma Web SaaS de Gestión Médica Multisede (Montepiedra Salud)  
**Semana del Sprint:** SEMANA 1 (17 Sep - 23 Sep, 2026)  
**Responsable / Autor:** JORGE (Responsable de Lógica de Agenda y Notificaciones)  
**Revisores:** SEBASTIÁN (Frontend & Flujo Clínico), ISAAC (Backend, Datos & Infraestructura)  
**Aprobación:** Consultor Senior en Operaciones Médicas y Arquitectura de Software  
**Estado:** `VALIDADO / LISTO PARA IMPLEMENTACIÓN SEMANA 2`  
**Versión:** 1.0.0 (Norma IEEE 830 Adaptada a Sistemas Clínicos Críticos)

---

## 1. RESUMEN EJECUTIVO Y ALCANCE OPERATIVO

El presente documento establece el marco formal matemático, operativo y algorítmico que rige el subsistema de agenda médica para profesionales itinerantes. En la zona urbana de Guayaquil, un médico itinerante atiende en tres consultorios privados con modelos comerciales y de infraestructura dispares (**Clínica Ceibos**, **Consultorio Mapasingue**, **Consultorio Alborada**) y cubre simultáneamente turnos asistenciales y guardias imprevistas en un **Hospital Público** (Ceibos / Vía a la Costa).

Este diseño erradica las cuatro patologías operativas más frecuentes en sistemas médicos ambulatorios:
1. La **teletransportación del facultativo** (citas contiguas en distintas sedes sin margen de desplazamiento).
2. El **conflicto de sala compartida** (Plan Dúo de consultorios donde el médico está libre pero el espacio físico está ocupado por otro colega).
3. La **cascada de retrasos** por slots nominales rígidos sin margen administrativo/post-consulta.
4. El **colapso de agenda por guardias de emergencia** hospitalarias no anticipadas.

Las especificaciones aquí descritas constituyen el contrato técnico vinculante sobre el cual se programa el `MotorCalendarioInteligente` en la Semana 2 y el Portal Transaccional de Pacientes en la Semana 3.

---

## 2. TAREA 1: CORRECCIÓN Y AUDITORÍA DE ERRORES LÓGICOS DE AGENDAMIENTO

### 2.1. Error 1: Citas Contiguas sin Traslado (Teletransportación del Médico)
* **Definición del Problema:** El sistema permite registrar una cita $C_1$ que finaliza a las 12:00 en Ceibos y una cita $C_2$ que inicia a las 12:00 o 12:15 en Alborada o Mapasingue. Al ignorar la topografía vial, la distancia física y la densidad vehicular de Guayaquil, se garantiza el retraso sistemático del médico, el deterioro de la atención y reclamos de pacientes.
* **Modelo Matemático de Solución:**
  Sea una cita previa $C_A$ en la sede $S_A$ con intervalo $[I_A, F_A]$ y una cita solicitada $C_B$ en la sede $S_B$ con intervalo $[I_B, F_B]$.
  Si $S_A \neq S_B$, se define la función de buffer de traslado:
  $$B(S_A, S_B, t) = T_{\text{base}}(S_A, S_B) + \Delta T_{\text{tráfico}}(S_A, S_B, t)$$
  Donde:
  - $T_{\text{base}}$: Tiempo neto de rodaje en condiciones fluidas (hora valle).
  - $\Delta T_{\text{tráfico}}(t)$: Margen de contingencia estocástico determinado por la franja horaria $t$.
  
  **Regla de Negocio RN-AG-01 (Invariante de Desplazamiento):**
  $$I_B - F_A \ge B(S_A, S_B, F_A)$$
  En caso de existir una cita posterior $C_C$ en sede $S_C$, se evalúa simétricamente:
  $$I_C - F_B \ge B(S_B, S_C, F_B)$$
* **Bloqueo en el Calendario:**
  En la base de datos y la interfaz visual, el espacio $[F_A, F_A + B(S_A, S_B, F_A)]$ se bloquea con un pseudo-evento inmutable de tipo `EN_TRASLADO` asociado al médico, impidiendo que el motor devuelva disponibilidad o permita reservas automáticas en ese rango.

---

### 2.2. Error 2: Conflicto de Recurso Físico vs. Profesional (Consultorios Compartidos / Plan Dúo)
* **Definición del Problema:** El sistema asume falsamente que si el médico itinerante está desocupado, el consultorio está automáticamente disponible. En consultorios compartidos (ej. Consultorio Privado 2 en Ceibos), dos o más especialistas rotan el uso de la misma sala física. Si un colega está atendiendo de 10:00 a 11:00, el médico itinerante no puede atender allí aunque no tenga pacientes agendados.
* **Modelo Matemático de Solución:**
  Para validar cualquier slot $[I, F]$ en la sala física $R_k$ con el médico $M_j$, deben cumplirse dos predicados conjuntamente:
  $$\text{Disponibilidad}(M_j, R_k, I, F) = \text{Libre}(M_j, I, F) \land \text{Libre}(R_k, I - \tau, F + \tau)$$
  Donde $\tau = T_{\text{sanit}}$ es el tiempo reglamentario de asepsia, cambio de sábanas camilleras y ventilación ($T_{\text{sanit}} = 10\text{ min}$).
  
  **Regla de Negocio RN-AG-02 (Doble Validación e Higiene de Sala):**
  Para toda cita existente $C_x$ en la misma sala $R_k$:
  $$\max(I, I_x) < \min(F, F_x) \implies \text{Conflicto de Sala (Rechazo)}$$
  $$I < F_x + T_{\text{sanit}} \land I \ge F_x \implies \text{Rechazo por Sanitización Pendiente}$$
  $$F + T_{\text{sanit}} > I_x \land F \le I_x \implies \text{Rechazo por Sanitización Pendiente}$$

---

### 2.3. Error 3: Falacia de la Duración Fija y Retrasos en Cascada
* **Definición del Problema:** Programar citas en bloques cerrados exactos de 30 minutos sin holgura post-consulta. Cualquier paciente complejo que requiera 38 minutos o una demora de 10 minutos al expedir una receta electrónica desplaza la cola completa de la tarde (efecto avalancha).
* **Modelo de Solución (Slot Nominal vs. Slot Real):**
  Desacoplar la percepción del paciente de la reserva efectiva en el motor:
  1. **Slot Nominal de Atención ($T_{\text{nom}}$):** Intervalo anunciado al paciente (30 minutos para consulta general estándar, 45 minutos para primera consulta o pacientes crónicos).
  2. **Margen Administrativo y Post-Consulta ($T_{\text{admin}}$):** Franja protegida de 15 minutos destinada a:
     - Diligenciamiento de la Historia Clínica y Ficha Médica en el sistema.
     - Prescripción y firma digital de la receta médica oficial.
     - Generación del comprobante de recaudación y cobro.
     - Entrega de indicaciones farmacológicas.
  3. **Slot Real de Reserva en Base de Datos ($T_{\text{real}}$):**
     $$T_{\text{real}} = T_{\text{nom}} + T_{\text{admin}} = 30\text{ min} + 15\text{ min} = 45\text{ minutos}$$
  
  **Regla de Negocio RN-AG-03 (Reserva con Amortiguamiento Administrativo):**
  El frontend ofrece turnos al público espaciados cada 45 minutos. Si el médico concluye en 28 minutos, dispone de 17 minutos de holgura. Si una consulta se extiende a 40 minutos, el médico aún inicia la siguiente a tiempo sin perjudicar al paciente posterior.

---

### 2.4. Error 4: Choque con Guardias Hospitalarias Imprevistas
* **Definición del Problema:** El médico recibe notificación de relevo urgente o guardia de emergencia en el Hospital Público, coincidiendo con citas agendadas en consultorios privados. La gestión manual genera llamadas telefónicas improvisadas, pacientes en sala de espera molestos y pérdidas económicas.
* **Modelo Operativo de Solución ("Protocolo Modo Guardia"):**
  Activación determinista en 5 fases ante la declaración del intervalo $[I_{\text{guardia}}, F_{\text{guardia}}]$:
  1. **Cálculo de la Ventana de Afectación Expandida:**
     Para cada sede privada $S$:
     $$V_{\text{inicio}}(S) = I_{\text{guardia}} - B(S, \text{HOSPITAL}, I_{\text{guardia}})$$
     $$V_{\text{fin}}(S) = F_{\text{guardia}} + B(\text{HOSPITAL}, S, F_{\text{guardia}})$$
  2. **Congelamiento Inmediato:** Bloqueo atómico de nuevos agendamientos privados en la ventana $[V_{\text{inicio}}, V_{\text{fin}}]$.
  3. **Identificación y Marcado:** Toda cita privada existente que intersecte $[V_{\text{inicio}}(S), V_{\text{fin}}(S)]$ muta de estado a `REAGENDAMIENTO_PENDIENTE_GUARDIA`, con `prioridad_reubicacion = 1` y motivo auditado `MSP_GUARDIA_IMPREVISTA`.
  4. **Despacho Transaccional Automatizado:** Disparo inmediato de notificaciones multicanal (WhatsApp Business API, SMS y correo electrónico transaccional) informando la causa de fuerza mayor e invitando al paciente a reconfirmar en un clic.
  5. **Mecanismo de Reubicación Prioritaria:** Asignación automática de los primeros slots disponibles de la siguiente rotación del médico en la misma sede, antes de abrir disponibilidad general.

---

## 3. TAREA 2: DEFINICIÓN DE SEDES Y MATRIZ INTERURBANA DE TRASLADOS

### 3.1. Caracterización de Sedes Operativas
1. **Sede Ceibos (Privada, Compartida):** Edificio Ceibos Plaza, Piso 3, Consultorio 2 (Av. del Bombero). Modalidad: Compartida con otros especialistas.
2. **Sede Alborada (Privada):** Av. Rodolfo Baquerizo Nazur, Alborada Etapa 8, Consultorio 4. Modalidad: Privada ambulatoria.
3. **Sede Mapasingue (Privada):** Av. Primera y Calle 3ra, Mapasingue Oeste, Consultorio 1A. Modalidad: Consultorio privado propio.
4. **Hospital Público Ceibos (Presencial / Guardias):** Vía a la Costa km 6.5. Modalidad: Guardia médica asistencial, triaje y emergencia MSP.

### 3.2. Definición de Franjas Horarias Urbanas en Guayaquil
* **Hora Pico Matutina:** 07:00 a 09:30 (ingreso laboral y escolar; alta saturación en Av. Carlos Julio Arosemena, Vía a la Costa y Perimetral).
* **Hora Pico Mediodía:** 12:30 a 14:00 (salida escolar y almuerzos comerciales).
* **Hora Pico Vespertina / Nocturna:** 17:00 a 19:45 (retorno laboral; saturación extrema en Av. Juan Tanca Marengo y enlaces Vía Daule - Perimetral).
* **Hora Valle:** Resto de horarios diurnos laborables (09:31 - 12:29; 14:01 - 16:59; 19:46 - 22:00).

### 3.3. Matriz Oficial de Distancias y Tiempos de Amortiguamiento

| Origen $\to$ Destino | Distancia Vial (km) | Ruta Arterial Principal | Tiempo Valle ($T_{\text{base}}$) | Margen Pico ($\Delta T_{\text{tráfico}}$) | Buffer Total Valle ($B_{\text{valle}}$) | Buffer Total Pico ($B_{\text{pico}}$) | Bloqueo por Defecto en Motor |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **Ceibos $\to$ Alborada** | 16.5 km | Av. del Bombero $\to$ C.J. Arosemena $\to$ J.T. Marengo | 35 min | +25 min | 45 min | 60 min | **60 min** |
| **Alborada $\to$ Ceibos** | 16.5 km | Benjamín Carrión $\to$ J.T. Marengo $\to$ Vía a la Costa | 35 min | +25 min | 45 min | 60 min | **60 min** |
| **Mapasingue $\to$ Ceibos** | 7.2 km | Av. Las Aguas $\to$ C.J. Arosemena $\to$ Av. del Bombero | 20 min | +15 min | 25 min | 35 min | **35 min** |
| **Ceibos $\to$ Mapasingue** | 7.2 km | Av. del Bombero $\to$ Enlace Arosemena $\to$ Mapasingue | 20 min | +15 min | 25 min | 35 min | **35 min** |
| **Mapasingue $\to$ Alborada** | 11.8 km | Av. Juan Tanca Marengo $\to$ Benjamín Carrión | 30 min | +20 min | 35 min | 50 min | **50 min** |
| **Alborada $\to$ Mapasingue** | 11.8 km | Benjamín Carrión $\to$ Juan Tanca Marengo $\to$ Oeste | 30 min | +20 min | 35 min | 50 min | **50 min** |
| **Ceibos $\to$ Hospital** | 4.5 km | Av. del Bombero $\to$ Enlace Vía a la Costa km 6.5 | 10 min | +10 min | 15 min | 20 min | **20 min** |
| **Hospital $\to$ Ceibos** | 4.5 km | Vía a la Costa km 6.5 $\to$ Retorno Av. del Bombero | 10 min | +10 min | 15 min | 20 min | **20 min** |
| **Mapasingue $\to$ Hospital** | 12.0 km | Carlos Julio Arosemena $\to$ Vía a la Costa km 6.5 | 25 min | +15 min | 30 min | 40 min | **40 min** |
| **Hospital $\to$ Mapasingue** | 12.0 km | Vía a la Costa km 6.5 $\to$ Av. C.J. Arosemena | 25 min | +15 min | 30 min | 40 min | **40 min** |
| **Alborada $\to$ Hospital** | 21.0 km | Fco. Orellana $\to$ Perimetral $\to$ Vía a la Costa km 6.5 | 40 min | +25 min | 50 min | 65 min | **65 min** |
| **Hospital $\to$ Alborada** | 21.0 km | Vía a la Costa km 6.5 $\to$ Perimetral $\to$ Fco. Orellana | 40 min | +25 min | 50 min | 65 min | **65 min** |

---

## 4. TAREA 3: MODELADO DE HORARIOS Y ROTACIONES SEMANALES

### 4.1. Política de Bloques Consolidados por Jornada
Para maximizar el tiempo efectivo de consulta y minimizar el desgaste psicofísico del médico:
* **Prohibición de Micro-Turnos:** Queda terminantemente prohibido programar saltos entre consultorios durante una misma media jornada (mañana o tarde). Por ejemplo: No se permite agendar de 08:00 a 10:00 en Ceibos y de 10:30 a 12:30 en Alborada.
* **Bloque Mínimo Asistencial:** Cada bloque en una sede privada debe tener una duración mínima continua de **4.0 horas** (equivalente a 5 o 6 pacientes con slot de 45 min).
* **Franja Central de Almuerzo y Traslado:** El intervalo de 13:00 a 14:00 (o 13:00 a 14:30) se reserva universalmente para almuerzo y desplazamiento entre sedes de la mañana y de la tarde.

### 4.2. Matriz de Rotación Semanal Recomendada (Plantilla Estándar)

| Día de la Semana | Jornada Matutina (08:00 - 13:00) | Ventana Traslado / Almuerzo | Jornada Vespertina (14:00 - 18:30) | Turno Noche / Guardia |
| :--- | :--- | :---: | :--- | :--- |
| **Lunes** | **Sede Ceibos** (08:00 - 13:00) | 13:00 - 14:00 (Traslado 35m) | **Sede Mapasingue** (14:00 - 18:00) | Libre / Descanso |
| **Martes** | **Sede Alborada** (08:30 - 13:00) | 13:00 - 14:30 (Traslado 60m) | **Sede Ceibos** (14:30 - 18:30) | Libre / Descanso |
| **Miércoles** | **Sede Mapasingue** (08:30 - 13:00) | 13:00 - 14:30 (Traslado 35m) | **Sede Ceibos** (14:30 - 18:30) | Libre / Descanso |
| **Jueves** | **Sede Ceibos** (08:00 - 13:00) | 13:00 - 14:30 (Traslado 60m) | **Sede Alborada** (14:30 - 18:30) | Libre / Descanso |
| **Viernes** | **Sede Mapasingue** (08:30 - 13:00) | 13:00 - 14:00 (Traslado 35m) | **Sede Ceibos** (14:00 - 18:00) | Liquidación Contable Semanal |
| **Sábado** | **Sede Alborada** (08:30 - 12:30) | 12:30 - 14:00 (Traslado 50m) | **Sede Mapasingue** (14:00 - 17:30) | **Hospital Público** (18:00 - 00:00) |
| **Domingo** | **Hospital Público** (Guardia 24h / Pasiva) | -- | **Hospital Público** (Asistencial) | Guardia Hospitalaria |

### 4.3. Reglas Operativas para Sobrecupo o Emergencias
1. **Mismo Recurso y Misma Sede:** El sobrecupo solo puede concederse en la sede donde el médico se encuentra físicamente atendiendo durante ese bloque. Queda bloqueada cualquier inserción de sobrecupo que requiera traslado no previsto.
2. **Cuota Máxima:** Máximo **1 cita de sobrecupo** por bloque de 4 horas (evita la degradación de la calidad clínica).
3. **Inviolabilidad de la Salida:** Si la jornada finaliza a las 18:00 y a las 19:00 el médico debe estar en otra sede o guardia, el sobrecupo no puede superar la hora límite que vulneraría el buffer $B(S_A, S_B)$.

---

## 5. TAREA 4: PSEUDOCÓDIGO Y ESPECIFICACIÓN ALGORÍTMICA DE DISPONIBILIDAD

```text
ALGORITMO: ValidarDisponibilidadSlot
ENTRADAS:
    medico_id          : Identificador del profesional médico
    sede_solicitada_id : Identificador de la sede requerida (CEIBOS, ALBORADA, MAPASINGUE, HOSPITAL)
    sala_solicitada_id : Identificador de la sala física compartida
    hora_inicio        : Timestamp con zona horaria (UTC / America/Guayaquil)
    hora_fin           : Timestamp con zona horaria
    citas_existentes   : Colección de citas registradas no canceladas en el sistema
    horarios_rotacion  : Plantilla semanal de turnos configurados del médico
    matriz_distancias  : Matriz relacional de tiempos de traslado interurbanos
    tiempo_sanit       : Minutos de sanitización de sala física (default = 10)
    ajuste_trafico     : Booleano que indica si se aplica discriminación hora pico vs valle

SALIDAS:
    Estructura ResultadoValidacion:
        valido                  : Booleano (TRUE si el slot es reservable, FALSE si es rechazado)
        codigo_error            : Cadena tipada (FUERA_DE_ROTACION, SALA_OCUPADA, SALA_SANITIZACION_PENDIENTE,
                                                 TRASLADO_INSUFICIENTE_PRE, TRASLADO_INSUFICIENTE_POST, OK)
        razon_rechazo           : Descripción comprensible para el usuario o logs de auditoría
        tiempo_buffer_requerido : Entero (minutos requeridos en caso de conflicto vial o sanitización)

INICIO:
    // ------------------------------------------------------------------------
    // PASO 0: Normalización Espacio-Temporal
    // ------------------------------------------------------------------------
    inicio_local <- ConvertirAZonaHoraria(hora_inicio, "America/Guayaquil")
    fin_local    <- ConvertirAZonaHoraria(hora_fin, "America/Guayaquil")
    dia_nombre   <- ObtenerDiaSemanaEspanol(inicio_local)
    t_inicio     <- ExtraerHora(inicio_local)
    t_fin        <- ExtraerHora(fin_local)

    // ------------------------------------------------------------------------
    // PASO 1: Validación del Horario de Rotación Médica
    // ------------------------------------------------------------------------
    SI horarios_rotacion NO ES NULO ENTONCES
        tiene_turno_valido <- FALSO
        PARA CADA rot EN horarios_rotacion HACER
            SI rot.medico_id == medico_id Y
               rot.sede_id == sede_solicitada_id Y
               rot.dia_semana == dia_nombre ENTONCES
                SI rot.hora_inicio <= t_inicio Y rot.hora_fin >= t_fin ENTONCES
                    tiene_turno_valido <- VERDADERO
                    ROMPER BUCLE
                FIN SI
            FIN SI
        FIN PARA

        SI tiene_turno_valido == FALSO ENTONCES
            RETORNAR ResultadoValidacion(
                valido = FALSO,
                codigo_error = "FUERA_DE_ROTACION",
                razon_rechazo = "El médico no dispone de turno rotativo en " + sede_solicitada_id + " el " + dia_nombre,
                tiempo_buffer_requerido = 0
            )
        FIN SI
    FIN SI

    // ------------------------------------------------------------------------
    // PASO 2: Doble Validación de Recurso Físico (Disponibilidad y Sanitización)
    // ------------------------------------------------------------------------
    PARA CADA cita EN citas_existentes HACER
        SI cita.estado EN ("CANCELADA", "REAGENDADA") ENTONCES
            CONTINUAR A SIGUIENTE CITA
        FIN SI

        SI cita.sala_id == sala_solicitada_id ENTONCES
            // 2.A: Traslape Temporal Directo: max(ini1, ini2) < min(fin1, fin2)
            SI Maximo(hora_inicio, cita.inicio) < Minimo(hora_fin, cita.fin) ENTONCES
                RETORNAR ResultadoValidacion(
                    valido = FALSO,
                    codigo_error = "SALA_OCUPADA",
                    razon_rechazo = "La sala física compartida se encuentra ocupada por otra atención médica",
                    tiempo_buffer_requerido = 0
                )
            FIN SI

            // 2.B: Ventana de Sanitización y Desalojo
            SI tiempo_sanit > 0 ENTONCES
                delta_sanit <- IntervaloMinutos(tiempo_sanit)
                SI (cita.fin <= hora_inicio) Y (hora_inicio < cita.fin + delta_sanit) ENTONCES
                    RETORNAR ResultadoValidacion(
                        valido = FALSO,
                        codigo_error = "SALA_SANITIZACION_PENDIENTE",
                        razon_rechazo = "La sala requiere " + tiempo_sanit + " min de asepsia tras la atención anterior",
                        tiempo_buffer_requerido = tiempo_sanit
                    )
                FIN SI

                SI (hora_fin <= cita.inicio) Y (cita.inicio < hora_fin + delta_sanit) ENTONCES
                    RETORNAR ResultadoValidacion(
                        valido = FALSO,
                        codigo_error = "SALA_SANITIZACION_PENDIENTE",
                        razon_rechazo = "La sala requiere " + tiempo_sanit + " min de asepsia antes de la atención posterior",
                        tiempo_buffer_requerido = tiempo_sanit
                    )
                FIN SI
            FIN SI
        FIN SI
    FIN PARA

    // ------------------------------------------------------------------------
    // PASO 3: Validación de Tiempos de Amortiguamiento y Traslado Interurbano
    // ------------------------------------------------------------------------
    // 3.A: Cita Previa Más Próxima del Médico en Otra Sede
    citas_previas_medico <- Filtrar(citas_existentes, c -> c.medico_id == medico_id Y c.fin <= hora_inicio)
    SI Longitud(citas_previas_medico) > 0 ENTONCES
        ultima_cita_previa <- ObtenerConMayorFin(citas_previas_medico)
        sede_origen <- ultima_cita_previa.sede_id

        SI sede_origen != sede_solicitada_id ENTONCES
            buffer_requerido <- ObtenerTiempoBuffer(matriz_distancias, sede_origen, sede_solicitada_id, t_inicio, ajuste_trafico)
            tiempo_disponible_min <- MinutosEntre(ultima_cita_previa.fin, hora_inicio)

            SI tiempo_disponible_min < buffer_requerido ENTONCES
                RETORNAR ResultadoValidacion(
                    valido = FALSO,
                    codigo_error = "TRASLADO_INSUFICIENTE_PRE",
                    razon_rechazo = "Tiempo insuficiente desde " + sede_origen + ". Requerido: " + buffer_requerido + " min.",
                    tiempo_buffer_requerido = buffer_requerido
                )
            FIN SI
        FIN SI
    FIN SI

    // 3.B: Cita Posterior Más Próxima del Médico en Otra Sede
    citas_posteriores_medico <- Filtrar(citas_existentes, c -> c.medico_id == medico_id Y c.inicio >= hora_fin)
    SI Longitud(citas_posteriores_medico) > 0 ENTONCES
        primera_cita_posterior <- ObtenerConMenorInicio(citas_posteriores_medico)
        sede_destino <- primera_cita_posterior.sede_id

        SI sede_destino != sede_solicitada_id ENTONCES
            buffer_requerido <- ObtenerTiempoBuffer(matriz_distancias, sede_solicitada_id, sede_destino, t_fin, ajuste_trafico)
            tiempo_disponible_min <- MinutosEntre(hora_fin, primera_cita_posterior.inicio)

            SI tiempo_disponible_min < buffer_requerido ENTONCES
                RETORNAR ResultadoValidacion(
                    valido = FALSO,
                    codigo_error = "TRASLADO_INSUFICIENTE_POST",
                    razon_rechazo = "Tiempo insuficiente hacia " + sede_destino + ". Requerido: " + buffer_requerido + " min.",
                    tiempo_buffer_requerido = buffer_requerido
                )
            FIN SI
        FIN SI
    FIN SI

    // ------------------------------------------------------------------------
    // PASO 4: Aprobación Integral
    // ------------------------------------------------------------------------
    RETORNAR ResultadoValidacion(
        valido = VERDADERO,
        codigo_error = "OK",
        razon_rechazo = "Slot disponible y sanitizado con tiempos de amortiguamiento cubiertos",
        tiempo_buffer_requerido = 0
    )
FIN ALGORITMO
```

---

## 6. TAREA 5: ENTREGABLES Y CRITERIOS DE ACEPTACIÓN SEMANALES

### 6.1. Criterios de Aceptación Funcionales (AC-F)
* **AC-F-01 (Auditoría Anti-Teletransportación):** Si el médico finaliza una atención a las 12:00 en Ceibos, el sistema debe rechazar automáticamente cualquier intento de reserva en Alborada antes de las 13:00 (requiere 60 min de buffer vial).
* **AC-F-02 (Asepsia en Consultorio Compartido):** Si una cita en el Consultorio Privado 2 finaliza a las 10:30, ninguna otra atención puede iniciar en ese mismo consultorio físico antes de las 10:40 (ventana obligatoria de sanitización de 10 min).
* **AC-F-03 (Slot Real Transaccional):** Toda reserva de consulta general debe apartar 45 minutos efectivos en base de datos (30 min nominales + 15 min de post-consulta/receta médica).
* **AC-F-04 (Protocolo Modo Guardia):** Ante la activación de una guardia hospitalaria imprevista de 15:00 a 19:00, las citas privadas afectadas deben migrar atómicamente al estado `REAGENDAMIENTO_PENDIENTE_GUARDIA`, bloqueando la agenda privada en la ventana expandida y despachando las notificaciones correspondientes.
* **AC-F-05 (Cuota de Sobrecupo):** No se permite ingresar más de 1 cita de sobrecupo en una misma jornada de 4 horas en la misma sede.

### 6.2. Criterios de Aceptación Técnicos y de Rendimiento (AC-T)
* **AC-T-01 (Latencia del Algoritmo):** La función `ValidarDisponibilidadSlot` debe ejecutarse en menos de **50 milisegundos** evaluando hasta 500 citas concurrentes.
* **AC-T-02 (Alineación Dual Python / JavaScript):** La lógica de negocio debe ejecutarse de forma indistinguible en el backend Python (`backend/motor_calendario.py`) y en el cliente web JavaScript (`js/services/collision-engine.js`).
* **AC-T-03 (Cobertura de Pruebas Automatizadas):** El 100% de los casos de prueba de borde (fronteras de traslape, horas pico, buffers de viaje, modo guardia) deben estar cubiertos por pruebas unitarias automatizadas (`test_motor_calendario.py`).

---

**Firma Digital y Responsabilidad del Documento:**  
*Jorge - Responsable de Lógica de Agenda y Notificaciones*  
*SaaS Gestión Médica Multisede - Montepiedra Salud (Septiembre 2026)*
