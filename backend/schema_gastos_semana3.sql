-- ============================================================================
-- MONTEPIEDRA SALUD - MÓDULO FINANCIERO Y CONTABILIDAD: SEMANA 3
-- Esquema Relacional de Gastos Operativos, Transporte e Insumos Médicos
-- Compatible con PostgreSQL 14+ / Supabase
-- ============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tipos Enumerados Específicos del Módulo de Gastos
DO $$ BEGIN
    CREATE TYPE tipo_gasto_general_enum AS ENUM ('TRANSPORTE', 'INSUMOS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_transporte_enum AS ENUM (
        'GASOLINA',
        'TAXI_APP',
        'PEAJE',
        'PARQUEADERO',
        'OTRO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE categoria_insumo_enum AS ENUM (
        'INSUMOS_MEDICOS_BASICOS',
        'MATERIAL_QUIRURGICO',
        'PAPELERIA_IMPRESIONES',
        'LIMPIEZA_DESINFECCION',
        'MANTENIMIENTO',
        'OTROS'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE origen_fondo_enum AS ENUM (
        'MEDICO_PERSONAL',   -- Dinero propio del médico -> Reembolso a favor del médico en liquidación
        'CAJA_CHICA_SEDE'   -- Fondo / Caja chica sede  -> Deducción operativa a la sede
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_comprobante_enum AS ENUM (
        'FACTURA_RUC',
        'NOTA_VENTA',
        'SIN_COMPROBANTE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_liquidacion_enum AS ENUM (
        'PENDIENTE',
        'EN_PROCESO',
        'LIQUIDADO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- TABLA: categorias_gasto (Catálogo Maestro)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias_gasto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    tipo_gasto tipo_gasto_general_enum NOT NULL,
    descripcion TEXT,
    deducible_sri BOOLEAN NOT NULL DEFAULT TRUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- TABLA: gastos_transporte (Movilidad en Rutas Interurbanas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gastos_transporte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    medico_id UUID NOT NULL,
    sede_id UUID NULL REFERENCES sedes(id) ON DELETE SET NULL,
    sede_codigo VARCHAR(30) NOT NULL DEFAULT 'GENERAL', -- 'CEIBOS', 'ALBORADA', 'MAPASINGUE', 'HOSPITAL', 'GENERAL'
    tipo_transporte tipo_transporte_enum NOT NULL,
    monto NUMERIC(10, 2) NOT NULL,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    motivo_justificacion TEXT NOT NULL,
    origen_fondo origen_fondo_enum NOT NULL DEFAULT 'MEDICO_PERSONAL',
    comprobante_url TEXT NULL,
    comprobante_nombre VARCHAR(255) NULL,
    estado_liquidacion estado_liquidacion_enum NOT NULL DEFAULT 'PENDIENTE',
    liquidacion_semanal_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_transporte_monto_positivo CHECK (monto > 0.00),
    CONSTRAINT chk_transporte_fecha_no_futura CHECK (fecha_hora <= NOW() + INTERVAL '5 minutes')
);

CREATE INDEX IF NOT EXISTS idx_transporte_medico ON gastos_transporte(medico_id);
CREATE INDEX IF NOT EXISTS idx_transporte_sede ON gastos_transporte(sede_codigo);
CREATE INDEX IF NOT EXISTS idx_transporte_fecha ON gastos_transporte(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_transporte_estado ON gastos_transporte(estado_liquidacion);

-- ----------------------------------------------------------------------------
-- TABLA: gastos_insumos (Suministros y Materiales Operativos por Sede)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gastos_insumos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(30) UNIQUE NOT NULL,
    medico_id UUID NOT NULL,
    sede_destino_id UUID NULL REFERENCES sedes(id) ON DELETE RESTRICT,
    sede_codigo VARCHAR(30) NOT NULL, -- 'CEIBOS', 'ALBORADA', 'MAPASINGUE', 'HOSPITAL'
    categoria_insumo categoria_insumo_enum NOT NULL,
    detalle_descripcion TEXT NOT NULL,
    monto_total NUMERIC(10, 2) NOT NULL,
    tipo_comprobante tipo_comprobante_enum NOT NULL DEFAULT 'FACTURA_RUC',
    numero_comprobante VARCHAR(60) NULL,
    adjunto_comprobante_url TEXT NULL,
    adjunto_nombre VARCHAR(255) NULL,
    origen_fondo origen_fondo_enum NOT NULL DEFAULT 'MEDICO_PERSONAL',
    estado_liquidacion estado_liquidacion_enum NOT NULL DEFAULT 'PENDIENTE',
    liquidacion_semanal_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_insumo_monto_positivo CHECK (monto_total > 0.00),
    CONSTRAINT chk_insumo_numero_comprobante CHECK (
        tipo_comprobante = 'SIN_COMPROBANTE' OR 
        (numero_comprobante IS NOT NULL AND LENGTH(TRIM(numero_comprobante)) > 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_insumos_medico ON gastos_insumos(medico_id);
CREATE INDEX IF NOT EXISTS idx_insumos_sede ON gastos_insumos(sede_codigo);
CREATE INDEX IF NOT EXISTS idx_insumos_estado ON gastos_insumos(estado_liquidacion);

-- ----------------------------------------------------------------------------
-- VISTA UNIFICADA: vista_gastos_operativos
-- Alimenta al Dashboard Contable y al Motor de Liquidación de la Semana 4
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vista_gastos_operativos AS
SELECT 
    t.id,
    t.codigo,
    'TRANSPORTE' AS tipo_gasto,
    t.sede_codigo,
    t.tipo_transporte::TEXT AS subcategoria,
    t.motivo_justificacion AS descripcion,
    t.monto,
    t.origen_fondo,
    CASE WHEN t.origen_fondo = 'MEDICO_PERSONAL' THEN TRUE ELSE FALSE END AS es_reembolso_medico,
    t.comprobante_url,
    t.comprobante_nombre,
    NULL::VARCHAR AS tipo_comprobante,
    NULL::VARCHAR AS numero_comprobante,
    t.estado_liquidacion,
    t.liquidacion_semanal_id,
    t.fecha_hora,
    t.created_at
FROM gastos_transporte t
UNION ALL
SELECT 
    i.id,
    i.codigo,
    'INSUMOS' AS tipo_gasto,
    i.sede_codigo,
    i.categoria_insumo::TEXT AS subcategoria,
    i.detalle_descripcion AS descripcion,
    i.monto_total AS monto,
    i.origen_fondo,
    CASE WHEN i.origen_fondo = 'MEDICO_PERSONAL' THEN TRUE ELSE FALSE END AS es_reembolso_medico,
    i.adjunto_comprobante_url AS comprobante_url,
    i.adjunto_nombre AS comprobante_nombre,
    i.tipo_comprobante::TEXT AS tipo_comprobante,
    i.numero_comprobante,
    i.estado_liquidacion,
    i.liquidacion_semanal_id,
    i.created_at AS fecha_hora,
    i.created_at
FROM gastos_insumos i;

-- ----------------------------------------------------------------------------
-- TRIGGER: Protección contra Eliminación de Gastos Ya Liquidados
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_proteger_gasto_liquidado()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado_liquidacion = 'LIQUIDADO' THEN
        RAISE EXCEPTION 'Operación denegada: No se puede modificar o eliminar un gasto que ya ha sido procesado en una liquidación semanal cerrada.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proteger_transporte_liquidado ON gastos_transporte;
CREATE TRIGGER trg_proteger_transporte_liquidado
BEFORE DELETE OR UPDATE ON gastos_transporte
FOR EACH ROW EXECUTE FUNCTION fn_proteger_gasto_liquidado();

DROP TRIGGER IF EXISTS trg_proteger_insumo_liquidado ON gastos_insumos;
CREATE TRIGGER trg_proteger_insumo_liquidado
BEFORE DELETE OR UPDATE ON gastos_insumos
FOR EACH ROW EXECUTE FUNCTION fn_proteger_gasto_liquidado();

-- ----------------------------------------------------------------------------
-- SEED DATA: Catálogo de Categorías y Gastos Semanales de Prueba
-- ----------------------------------------------------------------------------
INSERT INTO categorias_gasto (codigo, nombre, tipo_gasto, descripcion)
VALUES 
  ('TRANS_GAS', 'Gasolina / Combustible', 'TRANSPORTE', 'Consumo de gasolina para movilización entre consultorios'),
  ('TRANS_TAXI', 'Taxi / Apps de Movilidad', 'TRANSPORTE', 'Carreras de taxi, Uber, Cabify o Indrive para cobertura de citas'),
  ('TRANS_PEAJE', 'Peajes Urbanos', 'TRANSPORTE', 'Peaje Vía a la Costa y corredores viales'),
  ('TRANS_PARK', 'Parqueaderos', 'TRANSPORTE', 'Estacionamiento en clínicas y centros hospitalarios'),
  ('INS_BASIC', 'Insumos Médicos Básicos', 'INSUMOS', 'Guantes, alcohol antiséptico, jeringas y algodón'),
  ('INS_QUIR', 'Material Quirúrgico', 'INSUMOS', 'Bisturís, suturas, gasas estériles y campos'),
  ('INS_PAPEL', 'Papelería e Impresiones', 'INSUMOS', 'Recetarios, certificados médicos y hojas membretadas'),
  ('INS_LIMP', 'Limpieza y Desinfección', 'INSUMOS', 'Amonio cuaternario, toallas desinfectantes y jabón quirúrgico'),
  ('INS_MANT', 'Mantenimiento de Equipos', 'INSUMOS', 'Calibración de tensiómetros y cambio de peras/manguitos')
ON CONFLICT (codigo) DO NOTHING;
