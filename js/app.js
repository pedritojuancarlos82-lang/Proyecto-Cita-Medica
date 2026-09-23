/**
 * Controlador Principal y Router de la Aplicación (Montepiedra Salud)
 * Gestiona la navegación dinámica de la barra superior según la página activa
 * (Landing Institucional, Portal Paciente, Portal Médico, Portal Contable)
 * y garantiza la autenticación manual obligatoria.
 */

import { DEMO_USERS, store } from './state.js';
import { setupAuth } from './auth.js';
import { setupPatientPortal } from './patient.js';
import { setupDoctorPortal } from './doctor.js';
import { setupAccountantPortal } from './accountant.js';
import { aplicarMascaraInputs } from './validaciones-globales.js';

// Sistema de Notificaciones Toast
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-notifications-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-notifications-root';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'danger') icon = '🚨';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <span style="font-size: 1.1rem;">${icon}</span>
    <span style="flex: 1; line-height: 1.3;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// Inicialización de la Aplicación
document.addEventListener('DOMContentLoaded', () => {
  // Vistas / Pantallas Principales
  const viewLanding = document.getElementById('view-landing');
  const viewPatient = document.getElementById('view-patient');
  const viewDoctor = document.getElementById('view-doctor');
  const viewAccountant = document.getElementById('view-accountant');

  // Menús Dinámicos de la Barra Superior
  const navMenuLanding = document.getElementById('nav-menu-landing');
  const navMenuPatient = document.getElementById('nav-menu-patient');
  const navMenuDoctor = document.getElementById('nav-menu-doctor');
  const navMenuAccountant = document.getElementById('nav-menu-accountant');

  // Grupos de Acciones Dinámicas de la Barra Superior
  const navActionsLanding = document.getElementById('nav-actions-landing');
  const navActionsPatient = document.getElementById('nav-actions-patient');
  const navActionsDoctor = document.getElementById('nav-actions-doctor');
  const navActionsAccountant = document.getElementById('nav-actions-accountant');

  // Subtítulo del Logo en Barra Superior
  const navbarBrandHome = document.getElementById('navbar-brand-home');
  const navbarBrandSubtitle = document.getElementById('navbar-brand-subtitle');

  // Elementos de Usuario en la Barra
  const patientLoggedCard = document.getElementById('patient-logged-card');
  const patNavbarAvatar = document.getElementById('pat-navbar-avatar');
  const patNavbarName = document.getElementById('pat-navbar-name');
  const btnNavPatientOpenLogin = document.getElementById('btn-nav-patient-open-login');

  // Botones de Salir / Regreso
  const btnNavPatientBack = document.getElementById('btn-nav-patient-back');
  const btnPatientLogout = document.getElementById('btn-patient-logout');
  const btnDoctorLogout = document.getElementById('btn-doctor-logout');
  const btnAccountantLogout = document.getElementById('btn-accountant-logout');

  // Navegación al hacer clic en el Brand/Logo
  if (navbarBrandHome) {
    navbarBrandHome.addEventListener('click', () => {
      const activeView = store.getActiveView();
      if (activeView !== 'landing') {
        store.setActiveView('landing');
      }
    });
  }

  // Renderizar la Vista y la Barra Superior según el Estado Activo
  function renderActiveView() {
    const activeView = store.getActiveView();
    const currentUser = store.getCurrentUser();

    // 1. Ocultar todas las vistas de contenido
    if (viewLanding) viewLanding.style.display = 'none';
    if (viewPatient) viewPatient.style.display = 'none';
    if (viewDoctor) viewDoctor.style.display = 'none';
    if (viewAccountant) viewAccountant.style.display = 'none';

    // 2. Ocultar todos los menús centrales de la barra superior
    if (navMenuLanding) navMenuLanding.style.display = 'none';
    if (navMenuPatient) navMenuPatient.style.display = 'none';
    if (navMenuDoctor) navMenuDoctor.style.display = 'none';
    if (navMenuAccountant) navMenuAccountant.style.display = 'none';

    // 3. Ocultar todos los grupos de acciones de la barra superior
    if (navActionsLanding) navActionsLanding.style.display = 'none';
    if (navActionsPatient) navActionsPatient.style.display = 'none';
    if (navActionsDoctor) navActionsDoctor.style.display = 'none';
    if (navActionsAccountant) navActionsAccountant.style.display = 'none';

    // 4. Mostrar y configurar la barra según la página activa
    if (activeView === 'landing') {
      if (viewLanding) viewLanding.style.display = 'block';
      if (navMenuLanding) navMenuLanding.style.display = 'flex';
      if (navActionsLanding) navActionsLanding.style.display = 'flex';
      if (navbarBrandSubtitle) navbarBrandSubtitle.textContent = 'Centro Médico & Red Asistencial';

    } else if (activeView === 'paciente' || activeView === 'patient') {
      if (viewPatient) viewPatient.style.display = 'block';
      if (navMenuPatient) navMenuPatient.style.display = 'flex';
      if (navActionsPatient) navActionsPatient.style.display = 'flex';
      if (navbarBrandSubtitle) navbarBrandSubtitle.textContent = 'Portal de Pacientes & Citas';

      // Estado de usuario en la barra del paciente
      if (currentUser && currentUser.role === 'paciente') {
        if (patientLoggedCard) patientLoggedCard.style.display = 'flex';
        if (patNavbarName) patNavbarName.textContent = currentUser.name.split(' ')[0];
        if (patNavbarAvatar) patNavbarAvatar.src = currentUser.avatar;
        if (btnNavPatientOpenLogin) btnNavPatientOpenLogin.style.display = 'none';
      } else {
        if (patientLoggedCard) patientLoggedCard.style.display = 'none';
        if (btnNavPatientOpenLogin) btnNavPatientOpenLogin.style.display = 'inline-flex';
      }

    } else if (activeView === 'doctor') {
      if (viewDoctor) viewDoctor.style.display = 'flex';
      if (navMenuDoctor) navMenuDoctor.style.display = 'flex';
      if (navActionsDoctor) navActionsDoctor.style.display = 'flex';
      if (navbarBrandSubtitle) navbarBrandSubtitle.textContent = 'Portal Médico • Dr. Carlos Campoverde';

    } else if (activeView === 'contador' || activeView === 'accountant') {
      if (viewAccountant) viewAccountant.style.display = 'flex';
      if (navMenuAccountant) navMenuAccountant.style.display = 'flex';
      if (navActionsAccountant) navActionsAccountant.style.display = 'flex';
      if (navbarBrandSubtitle) navbarBrandSubtitle.textContent = 'Portal Contable & SRI • Lcda. Morales';
    }

    // Scroll arriba al cambiar de vista principal
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- BOTONES DE CIERRE DE SESIÓN Y RETORNO ---
  if (btnNavPatientBack) {
    btnNavPatientBack.addEventListener('click', () => {
      store.setActiveView('landing');
    });
  }

  if (btnPatientLogout) {
    btnPatientLogout.addEventListener('click', () => {
      store.setCurrentUser(null);
      showToast('Sesión de paciente cerrada. Regresando a la página principal.', 'info');
      renderActiveView();
    });
  }

  if (btnNavPatientOpenLogin) {
    btnNavPatientOpenLogin.addEventListener('click', (e) => {
      e.preventDefault();
      store.setActiveView('landing');
      setTimeout(() => {
        const portalAcceso = document.getElementById('portal-acceso');
        if (portalAcceso) portalAcceso.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });
  }

  if (btnDoctorLogout) {
    btnDoctorLogout.addEventListener('click', () => {
      store.setCurrentUser(null);
      showToast('Sesión médica finalizada. Regresando a la página institucional.', 'info');
      renderActiveView();
    });
  }

  if (btnAccountantLogout) {
    btnAccountantLogout.addEventListener('click', () => {
      store.setCurrentUser(null);
      showToast('Sesión contable finalizada. Regresando a la página institucional.', 'info');
      renderActiveView();
    });
  }

  // --- ENLACES Y BOTONES DE NAVEGACIÓN EN EL PORTAL CONTABLE ---
  const navBtnAccKpis = document.getElementById('nav-btn-acc-kpis');
  const navBtnAccSettlement = document.getElementById('nav-btn-acc-settlement');
  const navBtnAccProfitability = document.getElementById('nav-btn-acc-profitability');
  const navBtnAccTaxreport = document.getElementById('nav-btn-acc-taxreport');
  const btnNavAccountantSri = document.getElementById('btn-nav-accountant-sri-btn');

  if (navBtnAccKpis) {
    navBtnAccKpis.addEventListener('click', () => {
      const el = document.querySelector('.accountant-kpis-grid');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (navBtnAccSettlement) {
    navBtnAccSettlement.addEventListener('click', () => {
      const el = document.querySelector('.settlement-table-wrapper');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (navBtnAccProfitability) {
    navBtnAccProfitability.addEventListener('click', () => {
      const el = document.getElementById('clinic-profitability-container');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function triggerSriModal() {
    const btnExportTax = document.getElementById('btn-export-tax-report');
    if (btnExportTax) {
      btnExportTax.click();
    }
  }

  if (navBtnAccTaxreport) {
    navBtnAccTaxreport.addEventListener('click', triggerSriModal);
  }

  if (btnNavAccountantSri) {
    btnNavAccountantSri.addEventListener('click', triggerSriModal);
  }

  // --- FLUJO DE AGENDAMIENTO LIMPIO (Sin inicio automático de sesión) ---
  const btnNavbarBooking = document.getElementById('btn-navbar-book-now');
  const btnHeroBooking = document.getElementById('btn-hero-booking');

  function startBookingFlow(clinicId = null) {
    // Ingresar al portal de citas sin forzar inicio de sesión automático
    store.setActiveView('paciente');
    renderActiveView();

    if (clinicId) {
      setTimeout(() => {
        const targetClinicCard = document.querySelector(`.clinic-selection-card[data-clinic-id="${clinicId}"]`);
        if (targetClinicCard) {
          targetClinicCard.click();
        }
      }, 50);
    }
    showToast('Ingresando al portal de reserva de citas.', 'info');
  }

  if (btnNavbarBooking) {
    btnNavbarBooking.addEventListener('click', () => startBookingFlow());
  }

  if (btnHeroBooking) {
    btnHeroBooking.addEventListener('click', () => startBookingFlow());
  }

  // Botones de Agendamiento Directo desde las Tarjetas de Sedes
  document.querySelectorAll('.btn-book-clinic-direct').forEach(btn => {
    btn.addEventListener('click', () => {
      const clinicId = btn.dataset.clinic;
      startBookingFlow(clinicId);
    });
  });

  // Acordeón Interactivo de Preguntas Frecuentes (Dudas)
  document.querySelectorAll('.faq-item .faq-question-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parentItem = btn.closest('.faq-item');
      if (!parentItem) return;

      const wasActive = parentItem.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('active'));

      if (!wasActive) {
        parentItem.classList.add('active');
      }
    });
  });

  // Navegación suave para enlaces internos
  document.querySelectorAll('.nav-menu-link, .footer-links-list a').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const targetEl = document.querySelector(href);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Configuración de los submódulos
  setupAuth(showToast);
  setupPatientPortal(showToast);
  setupDoctorPortal(showToast);
  setupAccountantPortal(showToast);
  
  // Aplicar validaciones globales en tiempo real a todos los inputs
  aplicarMascaraInputs();

  // Escuchar cambios de estado global
  store.subscribe(() => {
    renderActiveView();
  });

  // Cerrar modales con clic en el fondo
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // Render inicial
  renderActiveView();
});
