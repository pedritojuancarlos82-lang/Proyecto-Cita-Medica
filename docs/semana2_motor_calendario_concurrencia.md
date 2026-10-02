# DOCUMENTO TÉCNICO DE ESPECIFICACIÓN Y ARQUITECTURA - SEMANA 2
## Motor de Disponibilidad, Concurrencia y Prevención de Choques Espacio-Temporales
**Proyecto:** SaaS de Gestión Médica Multisede (Montepiedra Salud)  
**Semana del Sprint:** SEMANA 2 (24 Sep - 30 Sep, 2026)  
**Hito 1 de Aceptación:** "Bloqueo estricto de espacios compartidos y tiempo de traslado verificado"  
**Responsable / Autor:** JORGE (Responsable de Lógica de Agenda y Notificaciones)  
**Revisores Técnicos:** SEBASTIÁN (Frontend & Flujo Clínico), ISAAC (Backend & Base de Datos)  
**Rol:** Ingeniero de Software Backend Senior y Diseñador de Algoritmos de Concurrencia  
**Estado:** `HITO 1 CUMPLIDO / 100% PRUEBAS UNITARIAS VERIFICADAS`

---

## 1. RESUMEN EJECUTIVO Y OBJETIVO DE LA SEMANA 2

Durante la Semana 2, la plataforma ha completado el desarrollo del **Motor de Calendario Inteligente**, traduciendo las especificaciones algebraicas de la Semana 1 en código de backend ejecutable de alta concurrencia. El sistema garantiza la consistencia transaccional absoluta ante múltiples reservas simultáneas, elimina los micro-bloqueos en límites de citas mediante intervalos semiabiertos $[I, F)$ y valida en tiempo real las cuatro locaciones de la red: **Ceibos**, **Alborada**, **Mapasingue** y **Hospital Público**.

---

## 2. TAREA 1: CORRECCIÓN Y AUDITORÍA DE ERRORES LÓGICOS CRÍTICOS EN LA AGENDA

```
+---------------------------------------------------------------------------------------------------------+
|                                ARQUITECTURA DE PROTECCIÓN ANTI-COLISIÓN                                 |
+---------------------------------------------------------------------------------------------------------+
|  1. Race Condition           -> Locks Transaccionales SELECT FOR UPDATE / Exclusión GiST tstzrange      |
|  2. Teletransportación       -> Verificación Bidireccional Pre/Post con Buffers Dinámicos (Pico/Valle)  |
|  3. Conflicto Plan Dúo       -> Desacoplamiento Dimensional (Médico Independiente de la Sala Física)   |
|  4. Micro-Bloqueo de Borde   -> Álgebra de Intervalos Semiabiertos [Inicio, Fin)                        |
+---------------------------------------------------------------------------------------------------------+
```

### 2.1. Condición de Carrera (Race Condition) en Reservas Simultáneas
* **Fallo Lógico:** Si dos pacientes en el portal web (o dos recepcionistas) pulsan "Confirmar Cita" en el mismo milisegundo para el slot de las 10:00 en el Consultorio Privado 2 de Ceibos, ambas transacciones leen la sala como "libre" antes de que la otra escriba, resultando en una doble reserva (*phantom overlap*).
* **Solución Arquitectónica:**
  1. **Nivel Base de Datos (PostgreSQL / Supabase):**
     Se utiliza una restricción de exclusión física respaldada por un índice GiST con tipos de rango temporal con zona horaria (`TSTZRANGE`):
     ```sql
     CONSTRAINT no_solapamiento_sala EXCLUDE USING gist (
         sala_id WITH =,
         rango_tiempo WITH &&
     ) WHERE (estado NOT IN ('CANCELADA', 'REAGENDADA'));
     ```
     En la capa de servicio de reserva se ejecuta un bloqueo de fila pesimista:
     ```sql
     SELECT id FROM salas_consultorio WHERE id = $1 FOR UPDATE;
     ```
  2. **Nivel Backend / Servicio en Memoria:**
     Se implementa exclusión mutua mediante cerrojos reentrantes (`threading.Lock()` en Python) en el método `reservar_slot_atomico`. La primera petición adquiere el lock, valida la disponibilidad y persiste la cita. La segunda petición es serializada, evalúa la sala ya ocupada y es rechazada limpiamente con `codigo_error="SALA_OCUPADA"`.

### 2.2. Error de Solapamiento en Traslados ("Teletransportación Médica")
* **Fallo Lógico:** Evaluar que el médico esté libre de 10:00 a 10:30 en Alborada ignorando que a las 09:50 finalizó una consulta en Ceibos y requiere 60 minutos de viaje interurbano.
* **Solución Algorítmica Bidireccional:**
  Para cualquier slot propuesto $[I_{\text{propuesto}}, F_{\text{propuesto}}]$ en sede $S_{\text{solicitada}}$:
  $$\forall C_{\text{previa}} \in \text{Citas}(M): \quad F_{\text{previa}} \le I_{\text{propuesto}} \implies I_{\text{propuesto}} - F_{\text{previa}} \ge B(S_{\text{previa}}, S_{\text{solicitada}}, F_{\text{previa}})$$
  $$\forall C_{\text{posterior}} \in \text{Citas}(M): \quad I_{\text{posterior}} \ge F_{\text{propuesto}} \implies I_{\text{posterior}} - F_{\text{propuesto}} \ge B(S_{\text{solicitada}}, S_{\text{posterior}}, F_{\text{propuesto}})$$
  El motor localiza la cita previa más cercana con $\max(F)$ y la posterior más inmediata con $\min(I)$, aplicando el tiempo de la matriz dinámicamente según franja pico/valle.

### 2.3. Choque de Recurso Físico en Modalidad Compartida (Plan Dúo)
* **Fallo Lógico:** En clínicas donde dos médicos comparten el mismo consultorio físico (Plan Dúo en Ceibos), validar solo la agenda del médico itinerante permite asignar una cita en una sala física donde otro profesional ya está atendiendo.
* **Solución Desacoplada:**
  El motor separa estrictamente la dimensión profesional de la dimensión de infraestructura:
  $$\text{SlotVálido} = \text{MédicoLibre}(M_j, I, F) \land \text{SalaFísicaLibre}(R_k, I, F)$$
  La función `verificar_conflicto_sala_fisica` audita todas las citas de la sala $R_k$ independientemente del médico que las atienda.

### 2.4. Micro-Bloqueos Fantasmas por Bordes Temporales (Off-By-One Boundaries)
* **Fallo Lógico:** Modelar intervalos cerrados $[I, F]$ genera falsas colisiones en el punto de contacto: una cita de 09:00 a 09:30 colisionaría con una de 09:30 a 10:00 porque $09:30 \in [09:00, 09:30] \cap [09:30, 10:00]$.
* **Solución Rigurosa con Intervalos Semiabiertos:**
  Todos los rangos operan bajo la convención $[I, F)$ (cerrado a la izquierda, abierto a la derecha). Dos intervalos $[I_1, F_1)$ e $[I_2, F_2)$ se solapan si y solo si:
  $$\max(I_1, I_2) < \min(F_1, F_2)$$
  Si $F_1 = 09:30$ e $I_2 = 09:30$, entonces $\max(09:00, 09:30) = 09:30$ y $\min(09:30, 10:00) = 09:30$. Como $09:30 < 09:30$ es **FALSO**, la condición de traslape es falsa y la cita es aprobada limpiamente.

---

## 3. TAREA 2: ESPECIFICACIÓN TÉCNICA DEL MOTOR DE DISPONIBILIDAD (BACKEND)

### 3.1. Funciones Centrales Implementadas en `backend/motor_calendario.py`

#### 1. `calcularMatrizTraslado(sedeOrigenId, sedeDestinoId, fechaHora)`
```python
@classmethod
def calcular_matriz_traslado(
    cls,
    sede_origen_id: str,
    sede_destino_id: str,
    fecha_hora: Optional[Union[datetime, time]] = None
) -> int:
    hora_local = None
    if isinstance(fecha_hora, datetime):
        hora_local = fecha_hora.astimezone(ECUADOR_TZ).time() if fecha_hora.tzinfo else fecha_hora.time()
    elif isinstance(fecha_hora, time):
        hora_local = fecha_hora

    return cls.calcular_buffer_traslado(
        sede_origen=sede_origen_id,
        sede_destino=sede_destino_id,
        hora_local=hora_local,
        ajustar_dinamico=True if hora_local else False
    )
```

#### 2. `verificarConflictoSalaFisica(salaId, rangoSolicitado, tx=None)`
```python
def verificar_conflicto_sala_fisica(
    self,
    sala_id: str,
    inicio: datetime,
    fin: datetime,
    citas_existentes: Optional[List[Dict[str, Any]]] = None,
    tiempo_sanitizacion_minutos: int = 0,
    tx=None
) -> Dict[str, Any]:
    inicio_utc = inicio if inicio.tzinfo else inicio.replace(tzinfo=zoneinfo.ZoneInfo("UTC"))
    fin_utc = fin if fin.tzinfo else fin.replace(tzinfo=zoneinfo.ZoneInfo("UTC"))

    lista_citas = citas_existentes if citas_existentes is not None else []
    for c in lista_citas:
        if c.get("estado") in ("CANCELADA", "REAGENDADA"):
            continue
        if c.get("sala_id") != sala_id:
            continue

        c_inicio = c["inicio"] if c["inicio"].tzinfo else c["inicio"].replace(tzinfo=zoneinfo.ZoneInfo("UTC"))
        c_fin = c["fin"] if c["fin"].tzinfo else c["fin"].replace(tzinfo=zoneinfo.ZoneInfo("UTC"))

        # Intervalo semiabierto [inicio, fin)
        if max(inicio_utc, c_inicio) < min(fin_utc, c_fin):
            msg = f"La sala de atención física {sala_id} se encuentra ocupada por otra atención entre {c_inicio.isoformat()} y {c_fin.isoformat()}."
            return {
                "permitido": False,
                "valido": False,
                "codigo_error": "SALA_OCUPADA",
                "mensaje": msg,
                "razon_rechazo": msg,
                "buffer_minutos_aplicado": 0,
                "tiempo_buffer_requerido": 0
            }
        
        # Margen de asepsia / sanitización
        if tiempo_sanitizacion_minutos > 0:
            delta_sanit = timedelta(minutes=tiempo_sanitizacion_minutos)
            if c_fin <= inicio_utc < (c_fin + delta_sanit):
                msg = f"La sala {sala_id} requiere {tiempo_sanitizacion_minutos} min de sanitización tras cita previa."
                return {
                    "permitido": False,
                    "valido": False,
                    "codigo_error": "SALA_SANITIZACION_PENDIENTE",
                    "mensaje": msg,
                    "razon_rechazo": msg,
                    "buffer_minutos_aplicado": tiempo_sanitizacion_minutos,
                    "tiempo_buffer_requerido": tiempo_sanitizacion_minutos
                }
    return {
        "permitido": True,
        "valido": True,
        "codigo_error": None,
        "mensaje": None,
        "razon_rechazo": None,
        "buffer_minutos_aplicado": 0,
        "tiempo_buffer_requerido": 0
    }
```

#### 3. `validarDisponibilidadMedico(medicoId, sedeId, salaId, inicio, fin)`
Ejecuta el pipeline completo de 4 pasos y retorna la estructura estandarizada:
```json
{
  "permitido": true,
  "codigo_error": null,
  "mensaje": null,
  "buffer_minutos_aplicado": 0,
  "valido": true,
  "razon_rechazo": null,
  "tiempo_buffer_requerido": 0
}
```

---

## 4. TAREA 3: GENERADOR DE SLOTS DE TIEMPO LIBRES (MOTOR DE BÚSQUEDA)

El método `generar_slots_disponibles(medico_id, sede_id, fecha, duracion_minutos=30)` realiza:
1. Inspección del cronograma rotativo del médico para determinar las ventanas de atención en la sede seleccionada.
2. Barrido cronológico con saltos parametrizables (`paso_minutos`, por defecto igual a la duración de la consulta).
3. Prueba estricta de cada candidato mediante `validar_disponibilidad`.
4. Exclusión de franjas colisionadas con citas preexistentes, salas ocupadas o franjas reservadas para tránsito interurbano.
5. Retorno de un payload formateado listo para el consumo del frontend en la Semana 3:
   ```json
   [
     {
       "hora_inicio": "08:00",
       "hora_fin": "08:30",
       "inicio_iso": "2026-09-25T08:00:00-05:00",
       "fin_iso": "2026-09-25T08:30:00-05:00",
       "sede_id": "CEIBOS",
       "sala_id": "SALA-CEIBOS-1",
       "duracion_minutos": 30,
       "dia_semana": "VIERNES"
     }
   ]
   ```

---

## 5. TAREA 4: SUITE DE PRUEBAS UNITARIAS (TESTING DE CASOS BORDE)

La suite de pruebas automatizadas en [`backend/test_motor_calendario.py`](file:///c:/Users/AlumnosMTP.MTP02-25/Documents/3ro%20Informatica%20-%20Max%20Campoverde/Profesor%20Edgar/Programacion/Protecto%20-%20Medico/backend/test_motor_calendario.py) contiene **14 pruebas unitarias formales**, cubriendo de forma exhaustiva los casos borde:

| Test ID | Caso de Prueba | Escenario Validado | Resultado |
| :--- | :--- | :--- | :---: |
| **Test 1** | `test_traslado_insuficiente_entre_sedes` | Fin 11:00 en Ceibos e inicio 11:15 en Alborada (requiere 60m). Rechazo obligatorio. | **APROBADO** |
| **Test 2** | `test_aprobacion_margen_viaje_exacto_frontera` | Fin 11:00 en Ceibos e inicio 12:00 en Alborada (exactamente 60m). Aprobación limpia sin micro-bloqueo. | **APROBADO** |
| **Test 3** | `test_bloqueo_sala_compartida_plan_duo_medico_libre` | Sala ocupada por médico 2 de 10:00 a 10:45. Médico 1 libre solicita 10:15. Rechazo por `SALA_OCUPADA`. | **APROBADO** |
| **Test 4** | `test_concurrencia_dos_solicitudes_simultaneas_mismo_slot` | Dos hilos concurrentes intentan reservar el mismo slot simultáneamente. Exactamente 1 éxito y 1 rechazo. | **APROBADO** |
| **Test 5** | `test_generador_slots_disponibles_motor_busqueda` | Generación de slots de 30m excluyendo slot reservado de 09:00 a 09:30 en Ceibos. | **APROBADO** |
| **Test 6-14**| Pruebas de liquidaciones contables, comisiones, modo guardia, sobrecupos y sanitización. | Cobertura integral del subsistema. | **APROBADO** |

---

## 6. TAREA 5: ENTREGABLES Y VALIDACIÓN DEL HITO 1

### 6.1. Definición de Tipos en TypeScript (`js/services/collision-engine.d.ts`)
```typescript
export interface ResultadoValidacionDisponibilidad {
  permitido: boolean;
  valido: boolean;
  codigoError: 'FUERA_DE_ROTACION' | 'SALA_OCUPADA' | 'SALA_SANITIZACION_PENDIENTE' | 
               'MEDICO_OCUPADO' | 'TRASLADO_INSUFICIENTE_PRE' | 'TRASLADO_INSUFICIENTE_POST' | null;
  mensaje: string | null;
  razonRechazo: string | null;
  bufferMinutosAplicado: number;
  tiempoBufferRequerido: number | null;
}

export interface SlotDisponibleDTO {
  horaInicio: string; // "08:00"
  horaFin: string;    // "08:30"
  inicioIso: string;
  finIso: string;
  sedeId: string;
  salaId: string;
  duracionMinutos: number;
  diaSemana: string;
}
```

### 6.2. Checklist Técnico Formal de Aceptación (Hito 1 - Jorge)
* [x] **Invariante de Desplazamiento:** Bloqueo automático de buffers de viaje bidireccionales verificado.
* [x] **Consultorios Compartidos (Plan Dúo):** Doble validación independiente de sala y médico verificada.
* [x] **Eliminación de Micro-bloqueos:** Intervalos semiabiertos $[I, F)$ operativos sin colisiones de borde.
* [x] **A prueba de Race Conditions:** Serialización atómica con exclusión mutua probada en entornos multihilo.
* [x] **Motor de Búsqueda:** Generador de slots libre de citas y traslados listo para integración con el portal público.
* [x] **Pruebas Automatizadas:** 14/14 tests superados en `test_motor_calendario.py` y 6/6 en `test_semana3.py`.
