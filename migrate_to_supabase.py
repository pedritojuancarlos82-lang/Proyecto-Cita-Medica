"""
Montepiedra Salud - Script de Migración Automática a Supabase
Transfiere todas las tablas y datos iniciales del proyecto hacia Supabase
usando la API REST de Supabase con la Secret Key (service_role) o Publishable Key.
"""

import urllib.request
import urllib.error
import json
import sys
import os

SUPABASE_PUBLISHABLE_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_zXgeds1KH5FZtPYWRAGnew_TsT5sf90")
SUPABASE_SECRET_KEY = os.environ.get("SUPABASE_SECRET_KEY", SUPABASE_PUBLISHABLE_KEY)
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")

def make_request(base_url, table, data, key=SUPABASE_SECRET_KEY):
    endpoint = f"{base_url.rstrip('/')}/rest/v1/{table}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation"
    }
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(endpoint, data=payload, headers=headers, method='POST')
    
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = resp.read().decode('utf-8')
            return True, status, body
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return False, e.code, error_body
    except Exception as e:
        return False, 500, str(e)

def migrate(project_url):
    print(f"🚀 Iniciando migración de datos hacia: {project_url}")

    # 1. Sedes
    clinics_data = [
        {
            "id": "ceibos",
            "name": "Clínica Ceibos",
            "type": "Consultorio Privado",
            "consultorio": "Consultorio 2",
            "address": "Av. del Bombero, Edificio Ceibos Plaza, Piso 3",
            "base_price": 20.00,
            "retention_rate": 0.25,
            "color": "#6366f1",
            "badge_class": "badge-ceibos",
            "image": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80"
        },
        {
            "id": "mapasingue",
            "name": "Consultorio Mapasingue",
            "type": "Consultorio Privado",
            "consultorio": "Consultorio 1A",
            "address": "Av. Primera y Calle 3ra, Mapasingue Oeste",
            "base_price": 20.00,
            "retention_rate": 0.05,
            "color": "#0284c7",
            "badge_class": "badge-mapasingue",
            "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80"
        },
        {
            "id": "alborada",
            "name": "Consultorio Alborada",
            "type": "Atención Comunitaria / Tarifa Reducida",
            "consultorio": "Consultorio 4",
            "address": "Av. Rodolfo Baquerizo Nazur, Alborada Etapa 8",
            "base_price": 10.00,
            "retention_rate": 0.10,
            "color": "#10b981",
            "badge_class": "badge-alborada",
            "image": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80"
        },
        {
            "id": "hospital",
            "name": "Hospital Público de Ceibos",
            "type": "Servicio Público de Salud",
            "consultorio": "Área de Emergencia y Triaje",
            "address": "Vía a la Costa km 6.5, Hospital General",
            "base_price": 0.00,
            "retention_rate": 0.00,
            "color": "#f59e0b",
            "badge_class": "badge-hospital",
            "image": "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80"
        }
    ]

    ok, code, res = make_request(project_url, "clinics", clinics_data)
    print(f"[{'OK' if ok else 'ERR'}] Migración Sedes (clinics): Código {code}")

    # 2. Usuarios
    users_data = [
        {
            "id": "USR-DOC",
            "role": "doctor",
            "name": "Dr. Carlos Campoverde",
            "email": "carlos.campoverde@montepiedrasalud.ec",
            "username": "doctor",
            "id_number": "0930860044",
            "password": "admin123",
            "phone": "+593 99 123 4567",
            "specialty": "Medicina General",
            "msp_code": "MSP-REG-84729",
            "avatar": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
        },
        {
            "id": "USR-PAT",
            "role": "paciente",
            "name": "Carlos Mendoza Moreira",
            "email": "paciente@gmail.com",
            "username": "paciente",
            "id_number": "0987654321",
            "password": "paciente123",
            "phone": "+593 98 765 4321",
            "allergies": "Penicilina, Sulfamidas",
            "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
        },
        {
            "id": "USR-ACC",
            "role": "contador",
            "name": "Lcda. Patricia Morales (Auditora)",
            "email": "contabilidad@clinicamed.com",
            "username": "contador",
            "id_number": "0912345678",
            "password": "contador123",
            "phone": "+593 99 876 5432",
            "firm": "Auditoría Fiscal & Asesoría Médica",
            "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        }
    ]

    ok, code, res = make_request(project_url, "users", users_data)
    print(f"[{'OK' if ok else 'ERR'}] Migración Usuarios (users): Código {code}")

    # 3. Citas Iniciales
    appointments_data = [
        {
            "id": "APT-1001",
            "code": "MED-1001",
            "patient_name": "Carlos Mendoza Moreira",
            "patient_id": "0987654321",
            "patient_phone": "0987654321",
            "patient_email": "paciente@gmail.com",
            "clinic_id": "alborada",
            "date": "2026-09-19",
            "time": "09:00",
            "duration_minutes": 45,
            "reason": "Control anual de hipertensión y chequeo rutinario",
            "payment_method": "efectivo",
            "base_price": 10.00,
            "fee_percentage": 0.0,
            "fee_amount": 0.0,
            "total_paid": 10.00,
            "retention_rate": 0.10,
            "retention_amount": 1.00,
            "net_clinic_yield": 9.00,
            "status": "confirmada",
            "settlement_status": "Liquidado",
            "notes": "Paciente con antecedente de HTA grado 1. Recomienda perfil lipídico."
        },
        {
            "id": "APT-1002",
            "code": "MED-1002",
            "patient_name": "Mariana Vera Loor",
            "patient_id": "0918237465",
            "patient_phone": "0991234567",
            "patient_email": "mariana.vera@yahoo.com",
            "clinic_id": "alborada",
            "date": "2026-09-19",
            "time": "10:00",
            "duration_minutes": 45,
            "reason": "Cuadro respiratorio agudo de 3 días de evolución",
            "payment_method": "tarjeta",
            "base_price": 10.00,
            "fee_percentage": 0.0975,
            "fee_amount": 0.98,
            "total_paid": 10.98,
            "retention_rate": 0.10,
            "retention_amount": 1.00,
            "net_clinic_yield": 9.00,
            "status": "confirmada",
            "settlement_status": "Liquidado",
            "notes": "Requiere auscultación y receta digital antibiótica."
        },
        {
            "id": "APT-1003",
            "code": "MED-1003",
            "patient_name": "Javier Andrade Romero",
            "patient_id": "0922883344",
            "patient_phone": "0984561230",
            "patient_email": "jandrade@gmail.com",
            "clinic_id": "ceibos",
            "date": "2026-09-19",
            "time": "13:00",
            "duration_minutes": 45,
            "reason": "Dolor articular lumbar y valoración general",
            "payment_method": "efectivo",
            "base_price": 20.00,
            "fee_percentage": 0.0,
            "fee_amount": 0.0,
            "total_paid": 20.00,
            "retention_rate": 0.25,
            "retention_amount": 5.00,
            "net_clinic_yield": 15.00,
            "status": "confirmada",
            "settlement_status": "Pendiente",
            "notes": "Indicar analgésicos y evaluación postural."
        },
        {
            "id": "APT-1004",
            "code": "MED-1004",
            "patient_name": "Sofía Carvajal Poveda",
            "patient_id": "0933772211",
            "patient_phone": "0978901234",
            "patient_email": "sofia.carvajal@outlook.com",
            "clinic_id": "ceibos",
            "date": "2026-09-19",
            "time": "14:00",
            "duration_minutes": 45,
            "reason": "Certificado de salud para ingreso laboral",
            "payment_method": "tarjeta",
            "base_price": 20.00,
            "fee_percentage": 0.0975,
            "fee_amount": 1.95,
            "total_paid": 21.95,
            "retention_rate": 0.25,
            "retention_amount": 5.00,
            "net_clinic_yield": 15.00,
            "status": "confirmada",
            "settlement_status": "Pendiente",
            "notes": "Examen físico completo y toma de signos vitales."
        },
        {
            "id": "APT-1005",
            "code": "MED-1005",
            "patient_name": "Elena Guamán Tomalá",
            "patient_id": "0944119988",
            "patient_phone": "0967894561",
            "patient_email": "elena.guaman@gmail.com",
            "clinic_id": "mapasingue",
            "date": "2026-09-19",
            "time": "16:00",
            "duration_minutes": 45,
            "reason": "Control glicemia y ajuste de antidiabético oral",
            "payment_method": "efectivo",
            "base_price": 20.00,
            "fee_percentage": 0.0,
            "fee_amount": 0.0,
            "total_paid": 20.00,
            "retention_rate": 0.05,
            "retention_amount": 1.00,
            "net_clinic_yield": 19.00,
            "status": "confirmada",
            "settlement_status": "Liquidado",
            "notes": "Revisión de glucómetro capilar en ayunas."
        }
    ]

    ok, code, res = make_request(project_url, "appointments", appointments_data)
    print(f"[{'OK' if ok else 'ERR'}] Migración Citas (appointments): Código {code}")

    # 4. Gastos
    expenses_data = [
        {"id": "EXP-101", "date": "2026-09-19", "category": "Transporte", "description": "Gasolina Super para traslados entre clínicas", "amount": 15.00, "payment_method": "Efectivo", "quick_logged": True, "deductible_sri": True},
        {"id": "EXP-102", "date": "2026-09-19", "category": "Transporte", "description": "Carrera de Taxi hacia Hospital Público Ceibos", "amount": 4.00, "payment_method": "Efectivo", "quick_logged": True, "deductible_sri": True},
        {"id": "EXP-103", "date": "2026-09-19", "category": "Suministros Hospital", "description": "Insumos médicos de emergencia (Guantes de nitrilo, gasas estériles y antiséptico)", "amount": 12.00, "payment_method": "Efectivo", "quick_logged": True, "deductible_sri": True},
        {"id": "EXP-104", "date": "2026-09-18", "category": "Mantenimiento", "description": "Desinfección y calibración de tensiómetro aneroide", "amount": 25.00, "payment_method": "Transferencia", "quick_logged": False, "deductible_sri": True},
        {"id": "EXP-105", "date": "2026-09-15", "category": "Transporte", "description": "Peajes urbanos Vía a la Costa y combustible", "amount": 18.50, "payment_method": "Efectivo", "quick_logged": False, "deductible_sri": True}
    ]

    ok, code, res = make_request(project_url, "expenses", expenses_data)
    print(f"[{'OK' if ok else 'ERR'}] Migración Gastos (expenses): Código {code}")

    # 5. Fichas Clínicas
    records_data = [
        {
            "id": "REC-001",
            "patient_id": "0987654321",
            "patient_name": "Carlos Mendoza Moreira",
            "age": 44,
            "blood_type": "O+",
            "allergies": "Penicilina, Sulfamidas (reacción urticariforme severa)",
            "history": "Hipertensión arterial esencial diagnosticada en 2022. No fumador.",
            "last_diagnosis": "HTA controlada con Losartán 50mg/día. Rinitis alérgica estacional.",
            "consultation_history": [
                {"date": "2026-06-12", "sede": "Consultorio Alborada", "motivo": "Revisión semestral", "pa": "125/82 mmHg"},
                {"date": "2026-01-20", "sede": "Clínica Ceibos", "motivo": "Faringitis aguda viral", "pa": "130/85 mmHg"}
            ]
        },
        {
            "id": "REC-002",
            "patient_id": "0918237465",
            "patient_name": "Mariana Vera Loor",
            "age": 32,
            "blood_type": "A+",
            "allergies": "AINES (Ibuprofeno causa broncoespasmo leve)",
            "history": "Asma bronquial intermitente desde la infancia. Sin cirugías previas.",
            "last_diagnosis": "Bronquitis aguda con sibilancias leves.",
            "consultation_history": [
                {"date": "2026-05-18", "sede": "Consultorio Alborada", "motivo": "Crisis asmática leve", "pa": "118/75 mmHg"}
            ]
        },
        {
            "id": "REC-003",
            "patient_id": "0922883344",
            "patient_name": "Javier Andrade Romero",
            "age": 51,
            "blood_type": "B+",
            "allergies": "Ninguna conocida (NKA)",
            "history": "Hernia discal L4-L5 diagnosticada en 2024. Sedentario.",
            "last_diagnosis": "Lumbago agudo mecánico con contractura paravertebral.",
            "consultation_history": [
                {"date": "2026-07-04", "sede": "Clínica Ceibos", "motivo": "Dolor de espalda baja", "pa": "135/88 mmHg"}
            ]
        }
    ]

    ok, code, res = make_request(project_url, "medical_records", records_data)
    print(f"[{'OK' if ok else 'ERR'}] Migración Fichas Clínicas (medical_records): Código {code}")

    # 6. Recetas
    prescriptions_data = [
        {
            "id": "RX-901",
            "code": "REC-2026-0901",
            "patient_name": "Carlos Mendoza Moreira",
            "patient_id": "0987654321",
            "doctor_name": "Dr. Carlos Campoverde",
            "doctor_code": "MSP-REG-84729",
            "date": "2026-09-19",
            "diagnosis": "Hipertensión Arterial Primaria (CIE-10: I10)",
            "items": [
                {"drug": "Losartán Potásico 50mg", "dose": "1 tableta vía oral cada 24 horas por la mañana", "duration": "30 días"},
                {"drug": "Aspirina Protect 100mg", "dose": "1 tableta después del almuerzo", "duration": "30 días"}
            ],
            "indications": "Disminuir consumo de sal y grasas saturadas. Realizar caminata 30 min diarios. Control de PA en 1 mes."
        }
    ]

    ok, code, res = make_request(project_url, "prescriptions", prescriptions_data)
    print(f"[{'OK' if ok else 'ERR'}] Migración Recetas (prescriptions): Código {code}")

    print("\n✨ Migración finalizada.")

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else None
    if not url:
        print("Uso: py migrate_to_supabase.py https://<TU-PROJECT-ID>.supabase.co")
    else:
        migrate(url)
