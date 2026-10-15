-- ============================================================================
-- MONTEPIEDRA SALUD - SEMANA 4 - PARTE 1
-- Módulo Clínico de Consulta, Expediente Médico SOAP y Signos Vitales
-- Tabla Relacional: historias_clinicas_soap
-- Compatible con PostgreSQL 14+ / Supabase
-- ============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ajuste de Estados en la Tabla de Citas (Soporte para 'in_consultation' y 'completed')
DO $$ 
BEGIN
    -- Si la restricción de estados existe en appointments, adaptarla para soportar 'in_consultation' y 'completed'
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'appointments_status_check'
    ) THEN
        ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;
        ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
            CHECK (status IN ('confirmada', 'confirmed', 'in_consultation', 'en_consulta', 'completed', 'atendida', 'en_guardia', 'cancelada'));
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Nota: No se pudo modificar appointments_status_check directamente (puede no existir aún).';
END $$;

-- 3. Tipos Enumerados para el Módulo SOAP
DO $$ BEGIN
    CREATE TYPE tipo_diagnostico_soap_enum AS ENUM ('presuntivo', 'definitivo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Creación de la Tabla Principal: historias_clinicas_soap
CREATE TABLE IF NOT EXISTS public.historias_clinicas_soap (
    id VARCHAR(64) PRIMARY KEY,
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
    doctor_id TEXT NOT NULL DEFAULT 'DOC-001',
    patient_id TEXT,
    patient_cedula VARCHAR(10) NOT NULL,
    
    -- Bloque S: Subjetivo
    -- Contiene: motivo_consulta, enfermedad_actual, anamnesis_detallada, antecedentes_relevantes
    subjetivo JSONB NOT NULL DEFAULT '{
        "motivo_consulta": "",
        "enfermedad_actual": "",
        "anamnesis_detallada": "",
        "antecedentes": ""
    }'::jsonb,
    
    -- Bloque Signos Vitales Reactivos con validación de rangos biológicos e IMC
    -- Contiene: presion_sistolica, presion_diastolica, presion_arterial, frecuencia_cardiaca,
    -- frecuencia_respiratoria, temperatura, saturacion_oxigeno, peso_kg, estatura_cm, imc, imc_clasificacion, alertas
    signos_vitales JSONB NOT NULL DEFAULT '{
        "presion_sistolica": 120,
        "presion_diastolica": 80,
        "presion_arterial": "120/80 mmHg",
        "frecuencia_cardiaca": 75,
        "frecuencia_respiratoria": 18,
        "temperatura": 36.5,
        "saturacion_oxigeno": 98,
        "peso_kg": 70,
        "estatura_cm": 170,
        "imc": 24.22,
        "imc_clasificacion": "Normal",
        "alertas": []
    }'::jsonb,
    
    -- Bloque O: Objetivo
    -- Contiene: examen físico segmentado (cabeza_cuello, torax_cardiopulmonar, abdomen, extremidades, neurologico)
    -- y observaciones del estado general
    objetivo JSONB NOT NULL DEFAULT '{
        "cabeza_cuello": "Normocéfalo, conjuntivas normocoloreadas, orofaringe sin exudado.",
        "torax_cardiopulmonar": "Simétrico, murmullo vesicular conservado sin ruidos sobreagregados. R1-R2 rítmicos.",
        "abdomen": "Blando, depresible, no doloroso a la palpación profunda, ruidos hidroaéreos presentes.",
        "extremidades": "Simétricas, sin edemas, pulsos periféricos distales presentes y simétricos.",
        "neurologico": "Alerta, orientado en tiempo, espacio y persona (Glasgow 15/15), sin signos meníngeos."
    }'::jsonb,
    
    -- Bloque A: Análisis y Diagnóstico (CIE-10)
    -- Contiene catálogo CIE-10 (código, descripción, tipo presuntivo/definitivo, notas analíticas)
    diagnostico_cie10 JSONB NOT NULL DEFAULT '[]'::jsonb,
    tipo_diagnostico VARCHAR(30) NOT NULL DEFAULT 'presuntivo' CHECK (tipo_diagnostico IN ('presuntivo', 'definitivo')),
    analisis_clinico TEXT,
    
    -- Bloque P: Plan Terapéutico y Conducta
    -- Contiene: medidas_no_farmacologicas, examenes_complementarios (laboratorio/imagen),
    -- observaciones_receta, proximo_control
    plan_terapeutico JSONB NOT NULL DEFAULT '{
        "medidas_no_farmacologicas": "",
        "examenes_laboratorio": [],
        "examenes_imagen": [],
        "indicaciones_receta": "",
        "proximo_control": ""
    }'::jsonb,
    
    -- Auditoría y Tiempos
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Índices de Optimización de Búsqueda Clínica
CREATE INDEX IF NOT EXISTS idx_soap_appointment_id ON public.historias_clinicas_soap(appointment_id);
CREATE INDEX IF NOT EXISTS idx_soap_patient_cedula ON public.historias_clinicas_soap(patient_cedula);
CREATE INDEX IF NOT EXISTS idx_soap_doctor_id ON public.historias_clinicas_soap(doctor_id);
CREATE INDEX IF NOT EXISTS idx_soap_created_at ON public.historias_clinicas_soap(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_soap_diagnostico_gin ON public.historias_clinicas_soap USING gin(diagnostico_cie10);

-- 6. Trigger para actualizar el estado de la Cita a 'completed' automáticamente
CREATE OR REPLACE FUNCTION public.fn_actualizar_cita_al_guardar_soap()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.appointment_id IS NOT NULL THEN
        UPDATE public.appointments
        SET 
            status = 'completed',
            notes = COALESCE(notes, '') || ' [Atención finalizada con registro SOAP: ' || NEW.id || ']'
        WHERE id = NEW.appointment_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_cita_soap ON public.historias_clinicas_soap;
CREATE TRIGGER trg_actualizar_cita_soap
AFTER INSERT ON public.historias_clinicas_soap
FOR EACH ROW
EXECUTE FUNCTION public.fn_actualizar_cita_al_guardar_soap();

-- 7. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.fn_soap_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_soap_updated_at ON public.historias_clinicas_soap;
CREATE TRIGGER trg_soap_updated_at
BEFORE UPDATE ON public.historias_clinicas_soap
FOR EACH ROW
EXECUTE FUNCTION public.fn_soap_set_updated_at();

-- 8. Seguridad a Nivel de Filas (RLS)
ALTER TABLE public.historias_clinicas_soap ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Acceso total lectura para usuarios autenticados y anon"
    ON public.historias_clinicas_soap
    FOR SELECT
    USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Permitir insercion de historias clinicas SOAP"
    ON public.historias_clinicas_soap
    FOR INSERT
    WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Permitir actualizacion de historias clinicas SOAP"
    ON public.historias_clinicas_soap
    FOR UPDATE
    USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 9. Comentarios descriptivos
COMMENT ON TABLE public.historias_clinicas_soap IS 'Expedientes clínicos y consultas bajo el estándar SOAP con signos vitales reactivos y catálogo CIE-10 (Semana 4 - Montepiedra Salud)';
COMMENT ON COLUMN public.historias_clinicas_soap.signos_vitales IS 'Constantes vitales calculadas en tiempo real: PA sistólica/diastólica, FC, FR, Temp, SpO2, Peso, Estatura e IMC';
COMMENT ON COLUMN public.historias_clinicas_soap.diagnostico_cie10 IS 'Arreglo estructurado de diagnósticos CIE-10 seleccionados con código, descripción y tipo presuntivo/definitivo';
