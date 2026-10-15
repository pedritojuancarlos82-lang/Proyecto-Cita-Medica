-- ============================================================================
-- MONTEPIEDRA SALUD - ESQUEMA RELACIONAL DEL MOTOR DE CITAS Y CALENDARIOS
-- Semana 2: Motor de prevención de choques, buffers y reglas financieras
-- Compatible con PostgreSQL 14+ / Supabase
-- ============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Tipos Enumerados
DO $$ BEGIN
    CREATE TYPE tipo_sede_enum AS ENUM ('PRIVADA', 'PUBLICA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dia_semana_enum AS ENUM (
        'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_cita_enum AS ENUM (
        'PENDIENTE', 'CONFIRMADA', 'EN_ATENCION', 'FINALIZADA', 'CANCELADA', 'REAGENDADA'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE metodo_pago_enum AS ENUM (
        'EFECTIVO', 'TRANSFERENCIA', 'TARJETA'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- TABLA: sedes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sedes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    tipo tipo_sede_enum NOT NULL DEFAULT 'PRIVADA',
    direccion TEXT NOT NULL,
    latitud NUMERIC(10, 7) NULL,
    longitud NUMERIC(10, 7) NULL,
    tarifa_base_general NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
    comision_porcentaje NUMERIC(5, 4) NOT NULL DEFAULT 0.0500, -- 0.05 = 5%, 0.25 = 25%
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_comision_rango CHECK (comision_porcentaje >= 0.0000 AND comision_porcentaje <= 1.0000),
    CONSTRAINT chk_tarifa_positiva CHECK (tarifa_base_general >= 0.00)
);

-- ----------------------------------------------------------------------------
-- TABLA: salas_consultorio (Recurso Físico Compartido)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salas_consultorio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sede_id UUID NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
    codigo_sala VARCHAR(30) NOT NULL,
    nombre_sala VARCHAR(100) NOT NULL,
    piso_ubicacion VARCHAR(50) NULL,
    capacidad INT NOT NULL DEFAULT 1,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sede_sala UNIQUE (sede_id, codigo_sala),
    CONSTRAINT chk_capacidad_positiva CHECK (capacidad > 0)
);

CREATE INDEX IF NOT EXISTS idx_salas_sede ON salas_consultorio(sede_id);

-- ----------------------------------------------------------------------------
-- TABLA: medicos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(150) NOT NULL,
    identificacion VARCHAR(13) UNIQUE NOT NULL, -- Cédula o RUC ecuatoriano
    registro_profesional VARCHAR(50) UNIQUE NOT NULL, -- MSP
    especialidad VARCHAR(100) NOT NULL DEFAULT 'Medicina General',
    telefono VARCHAR(15) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- TABLA: matriz_distancias_traslado (Tiempos Interurbanos y Buffers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matriz_distancias_traslado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sede_origen_id UUID NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
    sede_destino_id UUID NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
    distancia_km NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    tiempo_minutos_estimado INT NOT NULL,
    margen_trafico_minutos INT NOT NULL DEFAULT 15,
    tiempo_total_buffer_minutos INT GENERATED ALWAYS AS (tiempo_minutos_estimado + margen_trafico_minutos) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_origen_destino UNIQUE (sede_origen_id, sede_destino_id),
    CONSTRAINT chk_distancia_no_negativa CHECK (distancia_km >= 0),
    CONSTRAINT chk_tiempo_positivo CHECK (tiempo_minutos_estimado >= 0),
    CONSTRAINT chk_margen_positivo CHECK (margen_trafico_minutos >= 0)
);

CREATE INDEX IF NOT EXISTS idx_matriz_origen ON matriz_distancias_traslado(sede_origen_id);
CREATE INDEX IF NOT EXISTS idx_matriz_destino ON matriz_distancias_traslado(sede_destino_id);

-- ----------------------------------------------------------------------------
-- TABLA: horarios_disponibilidad (Plantilla Rotativa Semanal)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS horarios_disponibilidad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    sede_id UUID NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
    dia_semana dia_semana_enum NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_horario_coherente CHECK (hora_inicio < hora_fin)
);

CREATE INDEX IF NOT EXISTS idx_horarios_medico_sede ON horarios_disponibilidad(medico_id, sede_id, dia_semana);

-- ----------------------------------------------------------------------------
-- TABLA: citas (Transacciones de Atención Médica con Exclusiones GiST)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_cita VARCHAR(30) UNIQUE NOT NULL,
    medico_id UUID NOT NULL REFERENCES medicos(id) ON DELETE RESTRICT,
    sede_id UUID NOT NULL REFERENCES sedes(id) ON DELETE RESTRICT,
    sala_id UUID NOT NULL REFERENCES salas_consultorio(id) ON DELETE RESTRICT,
    paciente_identificacion VARCHAR(13) NOT NULL,
    paciente_nombre VARCHAR(150) NOT NULL,
    paciente_telefono VARCHAR(20) NOT NULL,
    paciente_email VARCHAR(120) NULL,
    
    -- Intervalo de tiempo continuo con huso horario
    rango_tiempo TSTZRANGE NOT NULL,
    
    estado estado_cita_enum NOT NULL DEFAULT 'CONFIRMADA',
    metodo_pago metodo_pago_enum NOT NULL DEFAULT 'EFECTIVO',
    
    -- Modelado Financiero Decimal Estricto
    monto_base NUMERIC(10, 2) NOT NULL,
    porcentaje_recargo NUMERIC(5, 4) NOT NULL DEFAULT 0.0000, -- 0.0975 si es tarjeta
    monto_recargo NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    monto_descuento_directo NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_cobrado NUMERIC(10, 2) NOT NULL,
    porcentaje_comision_sede NUMERIC(5, 4) NOT NULL,
    monto_comision_sede NUMERIC(10, 2) NOT NULL,
    ingreso_neto_medico NUMERIC(10, 2) NOT NULL,
    
    motivo_consulta TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- RESTRICCIÓN DE EXCLUSIÓN 1: Un médico NO puede tener dos citas solapadas
    CONSTRAINT no_solapamiento_medico EXCLUDE USING gist (
        medico_id WITH =,
        rango_tiempo WITH &&
    ) WHERE (estado NOT IN ('CANCELADA', 'REAGENDADA')),
    
    -- RESTRICCIÓN DE EXCLUSIÓN 2: Una sala física NO puede ser ocupada por dos citas solapadas
    CONSTRAINT no_solapamiento_sala EXCLUDE USING gist (
        sala_id WITH =,
        rango_tiempo WITH &&
    ) WHERE (estado NOT IN ('CANCELADA', 'REAGENDADA')),

    CONSTRAINT chk_monto_base_positivo CHECK (monto_base >= 0.00),
    CONSTRAINT chk_total_positivo CHECK (total_cobrado >= 0.00)
);

-- Índices de consulta de alta concurrencia
CREATE INDEX IF NOT EXISTS idx_citas_medico_rango ON citas USING gist (medico_id, rango_tiempo);
CREATE INDEX IF NOT EXISTS idx_citas_sede_fecha ON citas(sede_id, created_at);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(paciente_identificacion);

-- ----------------------------------------------------------------------------
-- SEED DATA: Sedes Oficiales y Matriz de Tiempos de Traslado (Guayaquil)
-- ----------------------------------------------------------------------------
INSERT INTO sedes (id, codigo, nombre, tipo, direccion, tarifa_base_general, comision_porcentaje)
VALUES 
  ('11111111-1111-4111-8111-111111111111', 'MAPASINGUE', 'Consultorio Mapasingue', 'PRIVADA', 'Av. Primera y Calle 3ra, Mapasingue Oeste', 20.00, 0.0500),
  ('22222222-2222-4222-8222-222222222222', 'CEIBOS', 'Clínica Ceibos (Consultorio Privado)', 'PRIVADA', 'Av. del Bombero, Edif. Ceibos Plaza, Piso 3', 20.00, 0.2500),
  ('33333333-3333-4333-8333-333333333333', 'ALBORADA', 'Consultorio Alborada (Tercer Local)', 'PRIVADA', 'Av. Rodolfo Baquerizo Nazur, Alborada Etapa 8', 10.00, 0.1000),
  ('44444444-4444-4444-8444-444444444444', 'HOSPITAL', 'Hospital Público de Ceibos', 'PUBLICA', 'Vía a la Costa km 6.5, Hospital General', 0.00, 0.0000)
ON CONFLICT (codigo) DO UPDATE 
SET tarifa_base_general = EXCLUDED.tarifa_base_general, comision_porcentaje = EXCLUDED.comision_porcentaje;

-- Salas por defecto
INSERT INTO salas_consultorio (sede_id, codigo_sala, nombre_sala)
VALUES 
  ('11111111-1111-4111-8111-111111111111', 'CONS-1A', 'Consultorio Principal 1A'),
  ('22222222-2222-4222-8222-222222222222', 'CONS-2', 'Consultorio Privado 2'),
  ('33333333-3333-4333-8333-333333333333', 'CONS-4', 'Consultorio Comunitario 4'),
  ('44444444-4444-4444-8444-444444444444', 'TRIAJE-1', 'Área de Triaje y Guardia')
ON CONFLICT DO NOTHING;

-- Matriz de Tiempos de Traslado con márgenes de tráfico urbano
INSERT INTO matriz_distancias_traslado (sede_origen_id, sede_destino_id, distancia_km, tiempo_minutos_estimado, margen_trafico_minutos)
VALUES
  -- De Mapasingue a otras sedes
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 7.5, 20, 15), -- Mapasingue -> Ceibos: 35 min buffer
  ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 11.2, 30, 20), -- Mapasingue -> Alborada: 50 min buffer
  ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', 9.0, 25, 15), -- Mapasingue -> Hospital: 40 min buffer

  -- De Ceibos a otras sedes
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 7.5, 20, 15),
  ('22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', 14.8, 35, 25), -- Ceibos -> Alborada: 60 min buffer
  ('22222222-2222-4222-8222-222222222222', '44444444-4444-4444-8444-444444444444', 3.2, 10, 10), -- Ceibos -> Hospital: 20 min buffer

  -- De Alborada a otras sedes
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 11.2, 30, 20),
  ('33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', 14.8, 35, 25),
  ('33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444', 16.0, 40, 25),

  -- De Hospital a otras sedes
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 9.0, 25, 15),
  ('44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222', 3.2, 10, 10),
  ('44444444-4444-4444-8444-444444444444', '33333333-3333-4333-8333-333333333333', 16.0, 40, 25)
ON CONFLICT (sede_origen_id, sede_destino_id) DO UPDATE
SET tiempo_minutos_estimado = EXCLUDED.tiempo_minutos_estimado,
    margen_trafico_minutos = EXCLUDED.margen_trafico_minutos;
