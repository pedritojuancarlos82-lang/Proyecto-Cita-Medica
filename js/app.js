/**
 * Controlador Principal y Router de la Aplicación (Montepiedra Salud)
 * Gestiona la navegación dinámica de la barra superior según la página activa
 * (Landing Institucional, Portal Paciente, Portal Médico, Portal Contable)
 * y garantiza la autenticación manual obligatoria.
 */

import { DEMO_USERS, store } from './state.js';
import { SUPABASE_CONFIG } from './supabase-config.js';
import { setupAuth } from './auth.js';
import { setupPatientPortal } from './patient.js';
import { setupDoctorPortal } from './doctor.js';
import { setupAccountantPortal } from './accountant.js';
import { aplicarMascaraInputs } from './validaciones-globales.js';
import { initAmbientBackground } from './ambient-background.js';

// Sistema de Notificaciones Toast (Limitado a 1 activo simultáneo para evitar spam)
let activeToastTimeout = null;

export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-notifications-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-notifications-root';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Si ya existe un toast visible, cancelar temporizador y limpiar contenedor
  if (activeToastTimeout) {
    clearTimeout(activeToastTimeout);
    activeToastTimeout = null;
  }
  container.innerHTML = '';

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'danger') icon = '🚨';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <span style="font-size: 1.1rem; flex-shrink: 0;">${icon}</span>
    <span style="flex: 1; line-height: 1.35; font-size: 0.86rem; font-weight: 500;">${message}</span>
  `;

  container.appendChild(toast);

  activeToastTimeout = setTimeout(() => {
    toast.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => {
      if (toast.parentNode === container) {
        toast.remove();
      }
    }, 350);
  }, 4000);
}



// Inicialización de la Aplicación
document.addEventListener('DOMContentLoaded', () => {
  // Inicialización del motor dinámico de fondo interactivo (Canvas + Mouse physics)
  initAmbientBackground();

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

  // Elementos de la Barra Superior y del Portal del Paciente
  const patientPortalTabBar = document.getElementById('patient-portal-tab-bar');
  const patientGuestNavActions = document.getElementById('patient-guest-nav-actions');
  const patientLoggedCard = document.getElementById('patient-logged-card');
  const patNavbarAvatar = document.getElementById('pat-navbar-avatar');
  const patNavbarName = document.getElementById('pat-navbar-name');
  const patientBrandSubtitle = document.getElementById('patient-brand-subtitle');
  const patientNavBrandBtn = document.getElementById('patient-nav-brand-btn');
  const btnPatientBackToWeb = document.getElementById('btn-patient-back-to-web');
  const btnPatientOpenLogin = document.getElementById('btn-patient-open-login');

  // Botones de Salir / Regreso
  const btnPatientLogout = document.getElementById('btn-patient-logout');
  const btnDoctorLogout = document.getElementById('btn-doctor-logout');
  const btnAccountantLogout = document.getElementById('btn-accountant-logout');

  // Navegación al hacer clic en el Brand/Logo o Logout (Retorno Seguro a Landing)
  function returnToLanding() {
    const patientView = document.getElementById('view-patient') || document.getElementById('portal-paciente');
    if (patientView) {
      patientView.classList.add('hidden', 'd-none');
      patientView.style.cssText = 'display: none !important;';
    }
    const doctorView = document.getElementById('view-doctor');
    if (doctorView) {
      doctorView.classList.add('hidden', 'd-none');
      doctorView.style.cssText = 'display: none !important;';
    }
    const accView = document.getElementById('view-accountant');
    if (accView) {
      accView.classList.add('hidden', 'd-none');
      accView.style.cssText = 'display: none !important;';
    }
    const landingView = document.getElementById('view-landing');
    if (landingView) {
      landingView.classList.remove('hidden', 'd-none');
      landingView.style.removeProperty('display');
      landingView.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important;';
    }
    if (window.store) {
      window.store.setActiveView('landing');
    }
    renderActiveView();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  window.returnToLanding = returnToLanding;

  if (navbarBrandHome) {
    navbarBrandHome.addEventListener('click', (e) => {
      e.preventDefault();
      returnToLanding();
    });
  }

  // Renderizar la Vista y la Barra Superior según el Estado Activo
  function renderActiveView() {
    const activeView = store.getActiveView();
    const currentUser = store.getCurrentUser();

    // 1. Ocultar todas las vistas de contenido de forma completa
    if (viewLanding) {
      viewLanding.classList.add('hidden');
      viewLanding.style.display = 'none';
    }
    if (viewPatient) {
      viewPatient.classList.add('hidden');
      viewPatient.style.display = 'none';
    }
    if (viewDoctor) {
      viewDoctor.classList.add('hidden');
      viewDoctor.style.display = 'none';
    }
    if (viewAccountant) {
      viewAccountant.classList.add('hidden');
      viewAccountant.style.display = 'none';
    }

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
      if (viewLanding) {
        viewLanding.classList.remove('hidden', 'd-none');
        viewLanding.style.removeProperty('display');
        viewLanding.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important;';
      }
      if (navMenuLanding) navMenuLanding.style.display = 'flex';
      if (navActionsLanding) navActionsLanding.style.display = 'flex';
      if (navbarBrandSubtitle) navbarBrandSubtitle.textContent = 'Centro Médico & Red Asistencial';

    } else if (activeView === 'paciente' || activeView === 'patient') {
      if (viewPatient) {
        viewPatient.classList.remove('hidden', 'd-none');
        viewPatient.style.removeProperty('display');
        viewPatient.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important; min-height: 100vh;';
      }

      // Estado de la barra según si el usuario ha iniciado sesión como paciente o es nuevo/invitado
      if (currentUser && currentUser.role === 'paciente') {
        // === USUARIO PACIENTE CON SESIÓN INICIADA ===
        // 1. Mostrar barra con las pestañas completas: Resumen, Mis Citas, Mis Datos, Agendar Cita
        if (patientPortalTabBar) patientPortalTabBar.style.display = 'flex';
        // 2. Mostrar tarjeta con el nombre del paciente y botón de salir
        if (patientLoggedCard) patientLoggedCard.style.display = 'flex';
        // 3. Ocultar los botones de invitado
        if (patientGuestNavActions) patientGuestNavActions.style.display = 'none';

        if (patNavbarName) patNavbarName.textContent = (currentUser.name || 'Carlos').split(' ')[0];
        if (patNavbarAvatar && currentUser.avatar) patNavbarAvatar.src = currentUser.avatar;
        if (patientBrandSubtitle) patientBrandSubtitle.textContent = 'Portal del Paciente';

        // Al iniciar sesión siempre abre la ventana de Resumen
        if (typeof window.renderPatientPortal === 'function') {
          window.renderPatientPortal();
        }
      } else {
        // === USUARIO NUEVO SIN INICIAR SESIÓN (AGENDAR CITA) ===
        // 1. Ocultar completamente los botones de pestañas (Resumen, Mis Citas, Mis Datos, Agendar Cita)
        if (patientPortalTabBar) patientPortalTabBar.style.display = 'none';
        // 2. Ocultar tarjeta de usuario logueado
        if (patientLoggedCard) patientLoggedCard.style.display = 'none';
        // 3. Mostrar en la barra los botones de regresar al sitio web o iniciar sesión
        if (patientGuestNavActions) patientGuestNavActions.style.display = 'flex';

        if (patientBrandSubtitle) patientBrandSubtitle.textContent = 'Agendamiento de Citas';

        // Mostrar directamente el panel para agendar cita
        if (typeof window.switchPatientTab === 'function') {
          window.switchPatientTab('agendar');
        } else {
          const patientPanes = document.querySelectorAll('.patient-portal-pane');
          patientPanes.forEach(pane => {
            pane.style.display = (pane.dataset.pane === 'agendar') ? 'block' : 'none';
          });
        }
      }

    } else if (activeView === 'doctor') {
      if (viewDoctor) {
        viewDoctor.classList.remove('hidden', 'd-none');
        viewDoctor.style.removeProperty('display');
        viewDoctor.style.cssText = 'display: flex !important; opacity: 1 !important; visibility: visible !important;';
      }
      if (navMenuDoctor) navMenuDoctor.style.display = 'flex';
      if (navActionsDoctor) navActionsDoctor.style.display = 'flex';
      if (navbarBrandSubtitle) navbarBrandSubtitle.textContent = 'Portal Médico';

    } else if (activeView === 'contador' || activeView === 'accountant') {
      if (viewAccountant) {
        viewAccountant.classList.remove('hidden', 'd-none');
        viewAccountant.style.removeProperty('display');
        viewAccountant.style.cssText = 'display: flex !important; opacity: 1 !important; visibility: visible !important;';
      }
      if (navMenuAccountant) navMenuAccountant.style.display = 'flex';
      if (navActionsAccountant) navActionsAccountant.style.display = 'flex';
      if (navbarBrandSubtitle) navbarBrandSubtitle.textContent = 'Portal Contable & SRI • Lcda. Morales';
    }

    // Scroll arriba al cambiar de vista principal
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.renderActiveView = renderActiveView;

  // --- BOTONES DE LA BARRA DEL PACIENTE PARA USUARIOS NUEVOS / INVITADOS Y LOGOUT ---
  if (btnPatientBackToWeb) {
    btnPatientBackToWeb.addEventListener('click', (e) => {
      e.preventDefault();
      returnToLanding();
    });
  }

  if (patientNavBrandBtn) {
    patientNavBrandBtn.addEventListener('click', (e) => {
      e.preventDefault();
      returnToLanding();
    });
  }

  if (btnPatientOpenLogin) {
    btnPatientOpenLogin.addEventListener('click', (e) => {
      e.preventDefault();
      const unifiedModal = document.getElementById('modal-unified-login');
      if (unifiedModal) {
        const patTab = unifiedModal.querySelector('.modal-role-tab-btn[data-role="paciente"]');
        if (patTab) patTab.click();
        unifiedModal.classList.add('active');
        const loginInput = document.getElementById('modal-login-username');
        if (loginInput) setTimeout(() => loginInput.focus(), 100);
      } else {
        returnToLanding();
      }
    });
  }

  if (btnPatientLogout) {
    btnPatientLogout.addEventListener('click', (e) => {
      e.preventDefault();
      store.setCurrentUser(null);
      showToast('Sesión de paciente cerrada. Regresando a la página principal.', 'info');
      returnToLanding();
    });
  }

  if (btnDoctorLogout) {
    btnDoctorLogout.addEventListener('click', (e) => {
      e.preventDefault();
      store.setCurrentUser(null);
      showToast('Sesión médica finalizada. Regresando a la página institucional.', 'info');
      returnToLanding();
    });
  }

  if (btnAccountantLogout) {
    btnAccountantLogout.addEventListener('click', (e) => {
      e.preventDefault();
      store.setCurrentUser(null);
      showToast('Sesión contable finalizada. Regresando a la página institucional.', 'info');
      returnToLanding();
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

  // =========================================================================
  // CONTROLADORES DIRECTOS DE LA BARRA DE NAVEGACIÓN SUPERIOR (NAVBAR)
  // Conexión robusta para "Iniciar Sesión" y "Agendar Cita" sin fallos de null
  // =========================================================================

  // --- FUNCIÓN UNIFICADA PARA ABRIR MODAL DE AUTENTICACIÓN ---
  function openAuthModal(defaultRole = 'paciente') {
    const loginModal = document.getElementById('modal-unified-login') ||
                       document.getElementById('modal-wizard-auth-gate') ||
                       document.getElementById('modal-auth');
    if (loginModal) {
      loginModal.classList.remove('hidden');
      loginModal.classList.add('active');
      const roleTab = loginModal.querySelector(`.modal-role-tab-btn[data-role="${defaultRole}"]`);
      if (roleTab) roleTab.click();
      const loginInput = document.getElementById('modal-login-username');
      if (loginInput) setTimeout(() => loginInput.focus(), 80);
    }
  }
  window.openAuthModal = openAuthModal;

  // 1. Conectar Botones "Iniciar Sesión" (Navbar Landing, Navbar Paciente, Hero, Wizard, Footer)
  const loginTriggerIds = [
    'btn-navbar-login-landing',
    'btn-nav-login',
    'btn-patient-open-login',
    'btn-wizard-open-login',
    'btn-hero-portal',
    'footer-btn-portal',
    'footer-btn-history'
  ];

  loginTriggerIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const role = (id === 'footer-btn-portal' || id === 'btn-hero-portal') ? 'doctor' : 'paciente';
        openAuthModal(role);
      });
    }
  });

  // Selector por clase para botones de login adicionales en la barra
  document.querySelectorAll('.btn-navbar-login, .btn-patient-nav-login, [data-action="login"]').forEach(btn => {
    if (!loginTriggerIds.includes(btn.id)) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openAuthModal('paciente');
      });
    }
  });

  // --- FLUJO DE AGENDAMIENTO LIMPIO CON DESPLAZAMIENTO SUAVE AL PASO 1 ---
  function startBookingFlow(clinicId = null) {
    // a) Oculta la vista landing:
    const landingEl = document.getElementById('view-landing');
    if (landingEl) {
      landingEl.classList.add('hidden', 'd-none');
      landingEl.style.display = 'none';
    }

    // b) Muestra la vista del paciente:
    const pView = document.getElementById('view-patient') || document.getElementById('portal-paciente');
    if (pView) {
      pView.classList.remove('hidden', 'd-none');
      pView.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important; min-height: 100vh;';
    }

    // e) Actualiza el estado global de la vista:
    if (window.store) window.store.setActiveView('paciente');
    renderActiveView();

    if (pView) {
      pView.classList.remove('hidden', 'd-none');
      pView.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important; min-height: 100vh;';
    }

    // c) Asegura que la pestaña activa sea el Wizard de Agendamiento en el Paso 1 (Sedes).
    const patPaneAgendar = document.getElementById('pat-pane-agendar');
    if (patPaneAgendar) {
      patPaneAgendar.classList.remove('hidden', 'd-none');
      patPaneAgendar.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
    }

    if (typeof window.switchPatientTab === 'function') {
      window.switchPatientTab('agendar');
    } else {
      const agendarTabBtn = document.getElementById('nav-btn-pat-agendar');
      if (agendarTabBtn) agendarTabBtn.click();
      const patientPanes = document.querySelectorAll('.patient-portal-pane');
      patientPanes.forEach(pane => {
        pane.style.display = (pane.dataset.pane === 'agendar') ? 'block' : 'none';
      });
    }

    const step1 = document.querySelector('.wizard-step-pane[data-step="1"]');
    if (step1) {
      step1.classList.remove('hidden', 'd-none');
      step1.style.cssText = 'display: block !important; opacity: 1 !important; visibility: visible !important;';
    }

    if (clinicId) {
      const targetClinicCard = document.querySelector(`.clinic-selection-card[data-clinic-id="${clinicId}"]`);
      if (targetClinicCard) {
        targetClinicCard.click();
      }
    }

    // d) Haz scroll al inicio del asistente:
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const wizardStep1 = document.querySelector('.wizard-step-pane[data-step="1"]') ||
                          document.getElementById('pat-pane-agendar') ||
                          document.querySelector('.wizard-stepper-container') ||
                          document.getElementById('view-patient');
      if (wizardStep1) {
        wizardStep1.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);

    if (typeof showToast === 'function') {
      showToast('Ingresando al Asistente de Agendamiento de Citas (Paso 1: Sedes).', 'info');
    }
  }
  window.startBookingFlow = startBookingFlow;

  // 2. Conectar Botones "Agendar Cita" (Navbar Landing, Hero, Tab Paciente, Footer)
  const bookingTriggerIds = [
    'btn-navbar-book-now',
    'btn-nav-book-appointment',
    'btn-hero-booking',
    'nav-btn-pat-agendar',
    'btn-citas-book-new',
    'btn-dash-quick-book',
    'footer-btn-book'
  ];

  bookingTriggerIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        startBookingFlow();
      });
    }
  });

  // Selector por clase para botones de agendamiento en barra y layout
  document.querySelectorAll('.btn-navbar-booking').forEach(btn => {
    if (!bookingTriggerIds.includes(btn.id)) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        startBookingFlow();
      });
    }
  });

  // Botones de Agendamiento Directo desde las Tarjetas de Sedes
  document.querySelectorAll('.btn-book-clinic-direct').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
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
  // CORREGIDO: #portal-acceso ahora abre el modal en vez de hacer scroll al pie de página
  document.querySelectorAll('.nav-menu-link, .footer-links-list a, .footer-bottom-link').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        if (href === '#portal-paciente') {
          e.preventDefault();
          e.stopPropagation();
          startBookingFlow();
          return;
        }
        if (href === '#portal-acceso') {
          e.preventDefault();
          e.stopPropagation();
          openAuthModal('paciente');
          return;
        }
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

  // --- MANUAL DE USUARIO INTERACTIVO MULTI-ROL (Semana 5 - Parte 3) ---
  const modalManual = document.getElementById('modal-manual-usuario');
  const btnCloseManual = document.getElementById('btn-close-manual-modal');
  const btnNavbarManual = document.getElementById('btn-navbar-open-manual');
  const btnFooterManual = document.getElementById('btn-footer-open-manual');
  const manualRoleButtons = document.querySelectorAll('.manual-tab-btn');
  const manualPanes = document.querySelectorAll('.manual-pane');

  function openUserManual(role = 'paciente') {
    if (!modalManual) return;
    switchManualTab(role);
    modalManual.classList.add('active');
  }
  window.openUserManualModal = openUserManual;

  function closeUserManual() {
    if (modalManual) modalManual.classList.remove('active');
  }

  function switchManualTab(role) {
    manualRoleButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.manualRole === role);
    });
    manualPanes.forEach(pane => {
      pane.style.display = (pane.id === `manual-pane-${role}`) ? 'flex' : 'none';
    });
  }

  if (btnNavbarManual) {
    btnNavbarManual.addEventListener('click', (e) => {
      e.preventDefault();
      openUserManual('paciente');
    });
  }

  if (btnFooterManual) {
    btnFooterManual.addEventListener('click', (e) => {
      e.preventDefault();
      openUserManual('paciente');
    });
  }

  if (btnCloseManual) {
    btnCloseManual.addEventListener('click', closeUserManual);
  }

  manualRoleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchManualTab(btn.dataset.manualRole);
    });
  });

  // Acciones interactivas rápidas desde el Manual
  const btnManualBooking = document.getElementById('btn-manual-action-booking');
  if (btnManualBooking) {
    btnManualBooking.addEventListener('click', () => {
      closeUserManual();
      startBookingFlow();
    });
  }

  const btnManualDoctor = document.getElementById('btn-manual-action-doctor');
  if (btnManualDoctor) {
    btnManualDoctor.addEventListener('click', () => {
      closeUserManual();
      store.setCurrentUser(DEMO_USERS.doctor);
      store.setActiveView('doctor');
      showToast('Bienvenido, Dr. Carlos Campoverde (MSP-REG-84729). Modo Demostración Activo.', 'success');
      renderActiveView();
    });
  }

  const btnManualAccountant = document.getElementById('btn-manual-action-accountant');
  if (btnManualAccountant) {
    btnManualAccountant.addEventListener('click', () => {
      closeUserManual();
      store.setCurrentUser(DEMO_USERS.contador);
      store.setActiveView('contador');
      showToast('Bienvenida, Lcda. Patricia Morales (Auditora Contable). Modo Demostración Activo.', 'success');
      renderActiveView();
    });
  }

  // --- BOTÓN RESTABLECER DATOS DE DEMOSTRACIÓN (Suite de Producción) ---
  const btnFooterResetDemo = document.getElementById('btn-footer-reset-demo');
  if (btnFooterResetDemo) {
    btnFooterResetDemo.addEventListener('click', (e) => {
      e.preventDefault();
      const confirmReset = window.confirm(
        '¿Deseas restaurar todos los datos de demostración de Montepiedra Salud a su estado inicial de producción?\n\n' +
        'Se restablecerán las citas de prueba en las 4 sedes, pacientes con antecedentes y alergias, gastos operativos de combustible y liquidaciones de la Semana 1 a la 5.'
      );
      if (confirmReset) {
        store.resetDemoData();
        showToast('✅ Datos de demostración restablecidos a estado inicial de producción.', 'success');
        renderActiveView();
        // Si hay modal abierto, cerrarlo
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      }
    });
  }

  // Render inicial
  renderActiveView();
});
