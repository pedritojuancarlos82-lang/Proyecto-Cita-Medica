import sys
import re

file_path = "js/doctor.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace switchDoctorTab to include ingresos
content = content.replace(
    "if (activeDoctorTab === 'gastos') renderExpensesTab();",
    "if (activeDoctorTab === 'gastos') renderExpensesTab();\n    if (activeDoctorTab === 'ingresos') renderIngresosTab();"
)

# Append the new function at the end of setupDoctorPortal
# It ends with '  setupPrescriptionTab();\n  setupExpensesTab();\n}'
# We will just append our function right before the last closing brace.

logic = """
  // --- INGRESOS ---
  function renderIngresosTab() {
    const kpiContainer = document.getElementById('ingresos-kpi-container');
    const listaContainer = document.getElementById('ingresos-lista');
    const formPago = document.getElementById('form-registrar-pago');
    const dateFilter = document.getElementById('ingresos-date-filter');

    if (!kpiContainer || !listaContainer || !formPago) return;

    if (!formPago.dataset.initialized) {
      formPago.addEventListener('submit', (e) => {
        e.preventDefault();
        const sede = document.getElementById('pago-sede').value;
        const fecha = document.getElementById('pago-fecha').value;
        const precio = parseFloat(document.getElementById('pago-precio').value);
        const metodo = document.getElementById('pago-metodo').value;

        if (!sede || !fecha || isNaN(precio) || !metodo) return;

        store.addAppointment({
          patientName: 'Ingreso Manual',
          patientId: '0000000000',
          clinicId: sede,
          date: fecha,
          time: '12:00',
          basePrice: precio,
          paymentMethod: metodo,
          reason: 'Consulta registrada manualmente',
        });
        
        formPago.reset();
        document.getElementById('pago-fecha').value = new Date().toISOString().split('T')[0];
        renderIngresosTab();
        
        if (typeof showToast === 'function') {
            showToast('Ingreso registrado exitosamente', 'success');
        }
      });

      dateFilter.addEventListener('change', () => {
        renderIngresosTab();
      });

      document.getElementById('pago-fecha').value = new Date().toISOString().split('T')[0];
      formPago.dataset.initialized = 'true';
    }

    const state = store.getState();
    const filterType = dateFilter.value;
    const today = '2026-09-19'; // using activeDate from prototype
    
    let filteredApps = state.appointments.filter(a => a.status !== 'cancelada');
    
    if (filterType === 'hoy') {
      filteredApps = filteredApps.filter(a => a.date === today);
    } else if (filterType === 'semana') {
       const refDate = new Date(today);
       filteredApps = filteredApps.filter(a => {
           const d = new Date(a.date);
           const diff = Math.abs(refDate - d) / (1000 * 60 * 60 * 24);
           return diff <= 7;
       });
    } else if (filterType === 'mes') {
       filteredApps = filteredApps.filter(a => a.date.startsWith('2026-09'));
    }

    let totalConsultas = 0;
    let totalBruto = 0;
    let totalComision = 0;
    let totalNeto = 0;

    const byDateAndSede = {};

    filteredApps.forEach(apt => {
       const date = apt.date;
       const sede = apt.clinicId || 'ceibos';
       
       if (!byDateAndSede[date]) byDateAndSede[date] = {};
       if (!byDateAndSede[date][sede]) {
           let sedeName = sede;
           if (CLINICS && CLINICS[sede]) sedeName = CLINICS[sede].name;
           byDateAndSede[date][sede] = { consultas: 0, bruto: 0, comision: 0, neto: 0, recargos: 0, sedeName };
       }

       byDateAndSede[date][sede].consultas++;
       
       let comisionVal = 0;
       if (sede !== 'hospital' && CLINICS[sede]) {
         comisionVal = apt.basePrice * CLINICS[sede].retentionRate;
       }
       
       // Handle recargo de tarjeta
       let recargo = 0;
       if (apt.paymentMethod === 'tarjeta' && apt.feeAmount) {
         recargo = apt.feeAmount;
       }
       
       let netoVal = apt.basePrice - comisionVal;
       
       byDateAndSede[date][sede].bruto += apt.basePrice;
       byDateAndSede[date][sede].comision += comisionVal;
       byDateAndSede[date][sede].recargos += recargo;
       byDateAndSede[date][sede].neto += netoVal;

       totalConsultas++;
       totalBruto += apt.basePrice;
       totalComision += comisionVal;
       totalNeto += netoVal;
    });

    kpiContainer.innerHTML = `
      <div class="kpi-card" style="padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="font-size: 0.75rem; color: #64748b;">Total Consultas</div>
        <div style="font-size: 1.25rem; font-weight: 700; color: #0f172a;">${totalConsultas}</div>
      </div>
      <div class="kpi-card" style="padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="font-size: 0.75rem; color: #64748b;">Total Bruto</div>
        <div style="font-size: 1.25rem; font-weight: 700; color: #0284c7;">$${totalBruto.toFixed(2)}</div>
      </div>
      <div class="kpi-card" style="padding: 10px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
        <div style="font-size: 0.75rem; color: #991b1b;">Comisiones</div>
        <div style="font-size: 1.25rem; font-weight: 700; color: #b91c1c;">$${totalComision.toFixed(2)}</div>
      </div>
      <div class="kpi-card" style="padding: 10px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
        <div style="font-size: 0.75rem; color: #166534;">Neto Recibido</div>
        <div style="font-size: 1.25rem; font-weight: 700; color: #15803d;">$${totalNeto.toFixed(2)}</div>
      </div>
    `;

    let listHtml = '';
    const sortedDates = Object.keys(byDateAndSede).sort((a,b) => b.localeCompare(a));
    
    sortedDates.forEach(date => {
       // Convertir YYYY-MM-DD a texto de día
       const days = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
       const dObj = new Date(date);
       const dayName = days[(dObj.getDay() + 6) % 7]; // basic adjustment, not perfect but okay
       
       listHtml += `<div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 12px;">
         <div style="background: #f1f5f9; padding: 8px 12px; font-weight: 600; font-size: 0.85rem; color: #334155; border-bottom: 1px solid #e2e8f0;">
            ${dayName} ${date}
         </div>
         <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">`;
       
       for (const sedeKey in byDateAndSede[date]) {
         const data = byDateAndSede[date][sedeKey];
         const recargoHtml = data.recargos > 0 ? `<span style="color: #ca8a04; font-size: 0.8rem;">(+$${data.recargos.toFixed(2)} recargo de tarjeta)</span>` : '';
         listHtml += `
           <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 2px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9; margin-bottom: 4px;">
             <span style="font-weight: 600; color: #0f172a;">${data.sedeName}</span>
             <span style="color: #475569;">Consultas: ${data.consultas} &rarr; Generado: $${data.bruto.toFixed(2)}</span>
             <span style="color: #ef4444;">Comisión Sede: $${data.comision.toFixed(2)} ${recargoHtml}</span>
             <span style="color: #10b981; font-weight: 600;">Ingreso Neto: $${data.neto.toFixed(2)}</span>
           </div>
         `;
       }
       
       listHtml += `</div></div>`;
    });

    if (sortedDates.length === 0) {
      listHtml = '<div style="text-align: center; color: #94a3b8; padding: 20px;">No hay ingresos en este rango.</div>';
    }

    listaContainer.innerHTML = listHtml;
  }
"""
# Insert right before the last closing brace.
content = re.sub(r'(\}\n*)$', logic + r'\1', content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
