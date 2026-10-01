-- ====================================================================
-- MONTEPIEDRA SALUD - ESQUEMA Y MIGRACIÓN COMPLETA A SUPABASE
-- ====================================================================

-- 1. EXTENSIONES Y LIMPIEZA PREVIA (Opcional si ya existían)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: users (Usuarios del sistema: Médicos, Pacientes, Contadores)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('doctor', 'paciente', 'contador')),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    id_number TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    specialty TEXT,
    msp_code TEXT,
    allergies TEXT,
    avatar TEXT,
    firm TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. TABLA: clinics (Sedes y Consultorios)
CREATE TABLE IF NOT EXISTS public.clinics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    consultorio TEXT NOT NULL,
    address TEXT NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    retention_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    color TEXT NOT NULL,
    badge_class TEXT NOT NULL,
    image TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. TABLA: appointments (Citas Médicas y Turnos)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    patient_phone TEXT,
    patient_email TEXT,
    clinic_id TEXT REFERENCES public.clinics(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 45,
    reason TEXT,
    payment_method TEXT DEFAULT 'efectivo',
    base_price NUMERIC(10, 2) DEFAULT 0.00,
    fee_percentage NUMERIC(6, 4) DEFAULT 0.00,
    fee_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_paid NUMERIC(10, 2) DEFAULT 0.00,
    retention_rate NUMERIC(6, 4) DEFAULT 0.00,
    retention_amount NUMERIC(10, 2) DEFAULT 0.00,
    net_clinic_yield NUMERIC(10, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'confirmada' CHECK (status IN ('confirmada', 'atendida', 'en_guardia', 'cancelada')),
    settlement_status TEXT DEFAULT 'Pendiente' CHECK (settlement_status IN ('Liquidado', 'Pendiente', 'Sueldo Fijo')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 5. TABLA: travel_buffers (Franjas de Traslado Protegido)
CREATE TABLE IF NOT EXISTS public.travel_buffers (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    from_clinic TEXT NOT NULL,
    to_clinic TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    buffer_label TEXT NOT NULL,
    status TEXT DEFAULT 'programado',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. TABLA: medical_records (Fichas Clínicas y Antecedentes)
CREATE TABLE IF NOT EXISTS public.medical_records (
    id TEXT PRIMARY KEY,
    patient_id TEXT UNIQUE NOT NULL,
    patient_name TEXT NOT NULL,
    age INTEGER,
    blood_type TEXT DEFAULT 'O+',
    allergies TEXT DEFAULT 'Sin alergias declaradas',
    history TEXT,
    last_diagnosis TEXT,
    consultation_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 7. TABLA: prescriptions (Recetas Médicas Oficiales)
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    doctor_code TEXT NOT NULL,
    date DATE NOT NULL,
    diagnosis TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    indications TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 8. TABLA: expenses (Gastos Operativos y de Ruta)
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Transporte', 'Mantenimiento', 'Suministros Hospital', 'Activos')),
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT DEFAULT 'Efectivo',
    quick_logged BOOLEAN DEFAULT FALSE,
    deductible_sri BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 9. TABLA: emergency_guard (Estado de Guardia Médica de Emergencia)
CREATE TABLE IF NOT EXISTS public.emergency_guard (
    id INTEGER PRIMARY KEY DEFAULT 1,
    is_active BOOLEAN DEFAULT FALSE,
    activated_at TIMESTAMPTZ,
    reason TEXT DEFAULT 'Guardia imprevista en Hospital Ceibos',
    affected_appointments JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 10. TABLA: consultation_catalog (Catálogo de Servicios Médicos)
CREATE TABLE IF NOT EXISTS public.consultation_catalog (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion_corta TEXT,
    duracion_minutos INTEGER DEFAULT 30,
    precio_base NUMERIC(10, 2) NOT NULL,
    categoria TEXT NOT NULL,
    estado TEXT DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 11. TABLA: diagnosis_catalog (Catálogo CIE-10 y Motivos)
CREATE TABLE IF NOT EXISTS public.diagnosis_catalog (
    id TEXT PRIMARY KEY,
    categoria TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    codigo_cie TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ====================================================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS) - LECTURA/ESCRITURA PÚBLICA / ANON
-- Permite que la API Key pública acceda a los datos según el SaaS
-- ====================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_buffers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_guard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_catalog ENABLE ROW LEVEL SECURITY;

-- Políticas de Acceso Completo para Rol Anon / Public Key
CREATE POLICY "Permitir acceso publico users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso publico clinics" ON public.clinics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso publico appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso publico travel_buffers" ON public.travel_buffers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso publico medical_records" ON public.medical_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso publico prescriptions" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso publico expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso publico emergency_guard" ON public.emergency_guard FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso publico consultation_catalog" ON public.consultation_catalog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso publico diagnosis_catalog" ON public.diagnosis_catalog FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- INSERCIÓN DE DATOS DE MIGRACIÓN (DATOS EXISTENTES DEL PROYECTO)
-- ====================================================================

-- 1. Sedes
INSERT INTO public.clinics (id, name, type, consultorio, address, base_price, retention_rate, color, badge_class, image)
VALUES
  ('ceibos', 'Clínica Ceibos', 'Consultorio Privado', 'Consultorio 2', 'Av. del Bombero, Edificio Ceibos Plaza, Piso 3', 20.00, 0.25, '#6366f1', 'badge-ceibos', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80'),
  ('mapasingue', 'Consultorio Mapasingue', 'Consultorio Privado', 'Consultorio 1A', 'Av. Primera y Calle 3ra, Mapasingue Oeste', 20.00, 0.05, '#0284c7', 'badge-mapasingue', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80'),
  ('alborada', 'Consultorio Alborada', 'Atención Comunitaria / Tarifa Reducida', 'Consultorio 4', 'Av. Rodolfo Baquerizo Nazur, Alborada Etapa 8', 10.00, 0.10, '#10b981', 'badge-alborada', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80'),
  ('hospital', 'Hospital Público de Ceibos', 'Servicio Público de Salud', 'Área de Emergencia y Triaje', 'Vía a la Costa km 6.5, Hospital General', 0.00, 0.00, '#f59e0b', 'badge-hospital', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  base_price = EXCLUDED.base_price,
  retention_rate = EXCLUDED.retention_rate;

-- 2. Usuarios del Sistema
INSERT INTO public.users (id, role, name, email, username, id_number, password, phone, specialty, msp_code, allergies, avatar, firm)
VALUES
  ('USR-DOC', 'doctor', 'Dr. Carlos Campoverde', 'carlos.campoverde@montepiedrasalud.ec', 'doctor', '0930860044', 'admin123', '+593 99 123 4567', 'Medicina General', 'MSP-REG-84729', NULL, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80', NULL),
  ('USR-PAT', 'paciente', 'Carlos Mendoza Moreira', 'paciente@gmail.com', 'paciente', '0987654321', 'paciente123', '+593 98 765 4321', NULL, NULL, 'Penicilina, Sulfamidas', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', NULL),
  ('USR-ACC', 'contador', 'Lcda. Patricia Morales (Auditora)', 'contabilidad@clinicamed.com', 'contador', '0912345678', 'contador123', '+593 99 876 5432', NULL, NULL, NULL, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'Auditoría Fiscal & Asesoría Médica')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password;

-- 3. Citas Iniciales del Sistema
INSERT INTO public.appointments (
  id, code, patient_name, patient_id, patient_phone, patient_email, clinic_id, date, time,
  duration_minutes, reason, payment_method, base_price, fee_percentage, fee_amount, total_paid,
  retention_rate, retention_amount, net_clinic_yield, status, settlement_status, notes
)
VALUES
  ('APT-1001', 'MED-1001', 'Carlos Mendoza Moreira', '0987654321', '0987654321', 'paciente@gmail.com', 'alborada', '2026-09-19', '09:00', 45, 'Control anual de hipertensión y chequeo rutinario', 'efectivo', 10.00, 0.0000, 0.00, 10.00, 0.1000, 1.00, 9.00, 'confirmada', 'Liquidado', 'Paciente con antecedente de HTA grado 1. Recomienda perfil lipídico.'),
  ('APT-1002', 'MED-1002', 'Mariana Vera Loor', '0918237465', '0991234567', 'mariana.vera@yahoo.com', 'alborada', '2026-09-19', '10:00', 45, 'Cuadro respiratorio agudo de 3 días de evolución', 'tarjeta', 10.00, 0.0975, 0.98, 10.98, 0.1000, 1.00, 9.00, 'confirmada', 'Liquidado', 'Requiere auscultación y receta digital antibiótica.'),
  ('APT-1003', 'MED-1003', 'Javier Andrade Romero', '0922883344', '0984561230', 'jandrade@gmail.com', 'ceibos', '2026-09-19', '13:00', 45, 'Dolor articular lumbar y valoración general', 'efectivo', 20.00, 0.0000, 0.00, 20.00, 0.2500, 5.00, 15.00, 'confirmada', 'Pendiente', 'Indicar analgésicos y evaluación postural.'),
  ('APT-1004', 'MED-1004', 'Sofía Carvajal Poveda', '0933772211', '0978901234', 'sofia.carvajal@outlook.com', 'ceibos', '2026-09-19', '14:00', 45, 'Certificado de salud para ingreso laboral', 'tarjeta', 20.00, 0.0975, 1.95, 21.95, 0.2500, 5.00, 15.00, 'confirmada', 'Pendiente', 'Examen físico completo y toma de signos vitales.'),
  ('APT-1005', 'MED-1005', 'Elena Guamán Tomalá', '0944119988', '0967894561', 'elena.guaman@gmail.com', 'mapasingue', '2026-09-19', '16:00', 45, 'Control glicemia y ajuste de antidiabético oral', 'efectivo', 20.00, 0.0000, 0.00, 20.00, 0.0500, 1.00, 19.00, 'confirmada', 'Liquidado', 'Revisión de glucómetro capilar en ayunas.')
ON CONFLICT (id) DO NOTHING;

-- 4. Franjas de Traslado
INSERT INTO public.travel_buffers (id, date, from_clinic, to_clinic, start_time, end_time, duration_minutes, buffer_label, status)
VALUES
  ('TRV-1', '2026-09-19', 'alborada', 'ceibos', '11:00', '12:45', 45, '🚗 En traslado de Alborada hacia Ceibos (45 min + colchón de llegada)', 'programado'),
  ('TRV-2', '2026-09-19', 'ceibos', 'mapasingue', '15:00', '15:45', 40, '🚗 En ruta hacia Mapasingue - 40 min buffer', 'programado')
ON CONFLICT (id) DO NOTHING;

-- 5. Fichas Médicas de Pacientes
INSERT INTO public.medical_records (id, patient_id, patient_name, age, blood_type, allergies, history, last_diagnosis, consultation_history)
VALUES
  ('REC-001', '0987654321', 'Carlos Mendoza Moreira', 44, 'O+', 'Penicilina, Sulfamidas (reacción urticariforme severa)', 'Hipertensión arterial esencial diagnosticada en 2022. No fumador.', 'HTA controlada con Losartán 50mg/día. Rinitis alérgica estacional.',
   '[{"date": "2026-06-12", "sede": "Consultorio Alborada", "motivo": "Revisión semestral", "pa": "125/82 mmHg"}, {"date": "2026-01-20", "sede": "Clínica Ceibos", "motivo": "Faringitis aguda viral", "pa": "130/85 mmHg"}]'::jsonb),
  ('REC-002', '0918237465', 'Mariana Vera Loor', 32, 'A+', 'AINES (Ibuprofeno causa broncoespasmo leve)', 'Asma bronquial intermitente desde la infancia. Sin cirugías previas.', 'Bronquitis aguda con sibilancias leves.',
   '[{"date": "2026-05-18", "sede": "Consultorio Alborada", "motivo": "Crisis asmática leve", "pa": "118/75 mmHg"}]'::jsonb),
  ('REC-003', '0922883344', 'Javier Andrade Romero', 51, 'B+', 'Ninguna conocida (NKA)', 'Hernia discal L4-L5 diagnosticada en 2024. Sedentario.', 'Lumbago agudo mecánico con contractura paravertebral.',
   '[{"date": "2026-07-04", "sede": "Clínica Ceibos", "motivo": "Dolor de espalda baja", "pa": "135/88 mmHg"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 6. Recetas Digitales Emitidas
INSERT INTO public.prescriptions (id, code, patient_name, patient_id, doctor_name, doctor_code, date, diagnosis, items, indications)
VALUES
  ('RX-901', 'REC-2026-0901', 'Carlos Mendoza Moreira', '0987654321', 'Dr. Carlos Campoverde', 'MSP-REG-84729', '2026-09-19', 'Hipertensión Arterial Primaria (CIE-10: I10)',
   '[{"drug": "Losartán Potásico 50mg", "dose": "1 tableta vía oral cada 24 horas por la mañana", "duration": "30 días"}, {"drug": "Aspirina Protect 100mg", "dose": "1 tableta después del almuerzo", "duration": "30 días"}]'::jsonb,
   'Disminuir consumo de sal y grasas saturadas. Realizar caminata 30 min diarios. Control de PA en 1 mes.')
ON CONFLICT (id) DO NOTHING;

-- 7. Gastos Operativos y Diarios
INSERT INTO public.expenses (id, date, category, description, amount, payment_method, quick_logged, deductible_sri)
VALUES
  ('EXP-101', '2026-09-19', 'Transporte', 'Gasolina Super para traslados entre clínicas', 15.00, 'Efectivo', true, true),
  ('EXP-102', '2026-09-19', 'Transporte', 'Carrera de Taxi hacia Hospital Público Ceibos', 4.00, 'Efectivo', true, true),
  ('EXP-103', '2026-09-19', 'Suministros Hospital', 'Insumos médicos de emergencia (Guantes de nitrilo, gasas estériles y antiséptico)', 12.00, 'Efectivo', true, true),
  ('EXP-104', '2026-09-18', 'Mantenimiento', 'Desinfección y calibración de tensiómetro aneroide', 25.00, 'Transferencia', false, true),
  ('EXP-105', '2026-09-15', 'Transporte', 'Peajes urbanos Vía a la Costa y combustible', 18.50, 'Efectivo', false, true)
ON CONFLICT (id) DO NOTHING;

-- 8. Guardia Médica
INSERT INTO public.emergency_guard (id, is_active, activated_at, reason, affected_appointments)
VALUES
  (1, false, null, 'Guardia imprevista en Hospital Ceibos convocada por Dirección Médica', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 9. Catálogo de Servicios
INSERT INTO public.consultation_catalog (id, codigo, nombre, descripcion_corta, duracion_minutos, precio_base, categoria, estado)
VALUES
  ('CG-01', 'CG-01', 'Consulta Médica General', 'Evaluación primaria para diagnóstico y tratamiento.', 30, 20.00, 'Atención Primaria', 'Activo'),
  ('CG-02', 'CG-02', 'Control Rutinario / Seguimiento', 'Seguimiento de tratamientos y revisión general.', 20, 15.00, 'Seguimiento', 'Activo'),
  ('CG-03', 'CG-03', 'Certificado de Salud y Aptitud Física', 'Evaluación para emisión de certificados de salud.', 30, 25.00, 'Certificaciones', 'Activo'),
  ('CG-04', 'CG-04', 'Atención Prioritaria / Urgencia Menor', 'Atención rápida para urgencias no vitales.', 45, 30.00, 'Prioritaria', 'Activo')
ON CONFLICT (id) DO NOTHING;

-- 10. Catálogo de Diagnósticos y Motivos
INSERT INTO public.diagnosis_catalog (id, categoria, descripcion, codigo_cie)
VALUES
  ('MG-001', 'Medicina General', 'Fiebre no especificada', 'R50.9'),
  ('MG-002', 'Medicina General', 'Cefalea (Dolor de cabeza)', 'R51'),
  ('MG-003', 'Medicina General', 'Fatiga y debilidad general', 'R53'),
  ('MG-004', 'Medicina General', 'Control de salud de rutina', 'Z00.0'),
  ('RESP-001', 'Respiratorio', 'Tos', 'R05'),
  ('RESP-002', 'Respiratorio', 'Dolor de garganta', 'J02.9'),
  ('RESP-003', 'Respiratorio', 'Dificultad para respirar (Disnea)', 'R06.0'),
  ('RESP-004', 'Respiratorio', 'Resfriado común', 'J00'),
  ('RESP-005', 'Respiratorio', 'Asma no especificada', 'J45.9'),
  ('DIG-001', 'Digestivo', 'Dolor abdominal', 'R10.4'),
  ('DIG-002', 'Digestivo', 'Diarrea y gastroenteritis', 'A09'),
  ('DIG-003', 'Digestivo', 'Náuseas y vómitos', 'R11'),
  ('DIG-004', 'Digestivo', 'Estreñimiento', 'K59.0'),
  ('CRON-001', 'Control Crónico', 'Control de Hipertensión Arterial', 'I10'),
  ('CRON-002', 'Control Crónico', 'Control de Diabetes Mellitus tipo 2', 'E11'),
  ('CRON-003', 'Control Crónico', 'Control de Dislipidemia (Colesterol alto)', 'E78.5'),
  ('PED-001', 'Pediatría', 'Control de niño sano', 'Z00.1'),
  ('PED-002', 'Pediatría', 'Erupción cutánea (Rash)', 'R21'),
  ('PED-003', 'Pediatría', 'Dolor de oído', 'H92.0')
ON CONFLICT (id) DO NOTHING;
