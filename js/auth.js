/**
 * Módulo de Autenticación y Control de Roles (Montepiedra Salud)
 * Maneja el inicio de sesión manual seguro, validación de credenciales (cédula o usuario + contraseña)
 * y previene cualquier acceso automático no autorizado.
 */

import { DEMO_USERS, store } from './state.js';
import {
  validarCedulaEcuatorianaDetallada,
  validarCelularDetallado,
  validarEmailDetallado,
  validarNombreCompletoDetallado
} from './validaciones-globales.js';

export function setupAuth(showToast) {
  const roleTabs = document.querySelectorAll('.role-tab-btn');
  const loginInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const passwordToggleBtn = document.getElementById('btn-toggle-password');
  const loginForm = document.getElementById('unified-login-form');

  let currentSelectedRole = 'doctor';

  // Cambiar rol activo en el selector de pestañas (guía visual para el usuario)
  roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      roleTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentSelectedRole = tab.dataset.role;

      if (loginInput) {
        if (currentSelectedRole === 'doctor') {
          loginInput.placeholder = 'Cédula o Usuario del Doctor';
        } else if (currentSelectedRole === 'paciente') {
          loginInput.placeholder = 'Cédula o Usuario del Paciente';
        } else {
          loginInput.placeholder = 'Cédula o Usuario Contable';
        }
      }
    });
  });

  // Botones de Autorelleno Rápido Demo (1 Clic)
  const demoButtons = document.querySelectorAll('.btn-demo-autofill');
  demoButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetRole = btn.dataset.role;
      const targetUser = btn.dataset.user;
      const targetPass = btn.dataset.pass;

      roleTabs.forEach(t => {
        if (t.dataset.role === targetRole) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
      currentSelectedRole = targetRole;

      if (loginInput) loginInput.value = targetUser;
      if (passwordInput) passwordInput.value = targetPass;

      if (loginForm) {
        loginForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
  });

  // SVGs Gráficos para el Ojo (Ojo abierto / visible vs Ojo tapado / tachado)
  const eyeOpenSvg = `<svg class="eye-svg eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const eyeClosedSvg = `<svg class="eye-svg eye-slashed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;

  // Mostrar / Ocultar contraseña con icono gráfico dinámico
  if (passwordToggleBtn && passwordInput) {
    passwordToggleBtn.innerHTML = eyeClosedSvg;
    passwordToggleBtn.setAttribute('title', 'Mostrar contraseña (hacer visible)');
    passwordToggleBtn.setAttribute('aria-label', 'Mostrar contraseña');

    passwordToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = passwordInput.getAttribute('type') === 'password';
      if (isPassword) {
        passwordInput.setAttribute('type', 'text');
        passwordToggleBtn.innerHTML = eyeOpenSvg;
        passwordToggleBtn.setAttribute('title', 'Ocultar contraseña (hacer invisible)');
        passwordToggleBtn.setAttribute('aria-label', 'Ocultar contraseña');
      } else {
        passwordInput.setAttribute('type', 'password');
        passwordToggleBtn.innerHTML = eyeClosedSvg;
        passwordToggleBtn.setAttribute('title', 'Mostrar contraseña (hacer visible)');
        passwordToggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
      }
    });
  }

  // Procesar envío del formulario: Validación estricta por rol
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredUser = (loginInput ? loginInput.value : '').trim().toLowerCase();
      const enteredPass = (passwordInput ? passwordInput.value : '').trim();

      if (!enteredUser || !enteredPass) {
        showToast('Por favor ingrese su usuario o cédula y su contraseña.', 'warning');
        return;
      }

      // Buscar usuario coincidente permitiendo credenciales nuevas y alternativas
      let matchedUser = null;

      // 1. Comprobar si coincide con el Médico Titular (Dr. Carlos Campoverde)
      const doc = DEMO_USERS.doctor;
      const isDoctorUser = (
        enteredUser === doc.username.toLowerCase() ||
        enteredUser === doc.email.toLowerCase() ||
        enteredUser === doc.idNumber ||
        enteredUser === doc.alternativeId ||
        enteredUser === '0930860044' ||
        enteredUser === '0928374651' ||
        enteredUser === 'carlos campoverde' ||
        enteredUser === 'campoverde' ||
        enteredUser === 'dr. campoverde' ||
        enteredUser === 'dr. carlos campoverde' ||
        (currentSelectedRole === 'doctor' && (enteredUser === 'doctor' || enteredUser === 'admin'))
      );
      const isDoctorPass = (
        enteredPass === doc.password ||
        enteredPass === doc.alternativePassword ||
        enteredPass === 'admin123' ||
        enteredPass === 'doctor123'
      );

      if (isDoctorUser && isDoctorPass) {
        matchedUser = doc;
      }

      // 2. Comprobar si coincide con Paciente
      if (!matchedUser) {
        const pat = DEMO_USERS.paciente;
        const isPatUser = (
          enteredUser === pat.username.toLowerCase() ||
          enteredUser === pat.email.toLowerCase() ||
          enteredUser === pat.idNumber ||
          enteredUser === 'carlos mendoza'
        );
        if (isPatUser && enteredPass === pat.password) {
          matchedUser = pat;
        }
      }

      // 3. Comprobar si coincide con Contadora
      if (!matchedUser) {
        const acc = DEMO_USERS.contador;
        const isAccUser = (
          enteredUser === acc.username.toLowerCase() ||
          enteredUser === acc.email.toLowerCase() ||
          enteredUser === acc.idNumber ||
          enteredUser === 'patricia morales'
        );
        if (isAccUser && enteredPass === acc.password) {
          matchedUser = acc;
        }
      }

      // 4. Si aún no coincide, buscar en bucle general (incluye usuarios recién creados)
      if (!matchedUser) {
        for (const key in DEMO_USERS) {
          const u = DEMO_USERS[key];
          if (
            (u.username.toLowerCase() === enteredUser ||
             u.email.toLowerCase() === enteredUser ||
             u.idNumber === enteredUser) &&
            u.password === enteredPass
          ) {
            matchedUser = u;
            break;
          }
        }
      }

      if (matchedUser) {
        // Validación estricta del rol seleccionado:
        // Si el usuario seleccionó "Doctor" pero ingresó datos de paciente o contador, o viceversa, se bloquea.
        const roleLabelMap = {
          doctor: 'Médico',
          paciente: 'Paciente',
          contador: 'Contador(a)'
        };

        if (matchedUser.role !== currentSelectedRole) {
          const userRoleName = roleLabelMap[matchedUser.role] || matchedUser.role;
          const selectedRoleName = roleLabelMap[currentSelectedRole] || currentSelectedRole;
          showToast(`Acceso bloqueado: Esta cuenta pertenece al perfil de ${userRoleName}. Por favor seleccione la pestaña de "${selectedRoleName}" adecuada o ingrese con las credenciales correspondientes.`, 'danger');
          return;
        }

        // Autenticación exitosa
        store.setCurrentUser(matchedUser);
        store.setActiveView(matchedUser.role);
        showToast(`Acceso exitoso. Bienvenido(a), ${matchedUser.name}`, 'success');

        // Limpiar URL hash si existía #portal-acceso para que no afecte la vista
        if (window.location.hash) {
          history.replaceState(null, '', window.location.pathname);
        }

        // Subir suavemente al tope de la pantalla
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Limpiar campos del formulario por seguridad
        if (loginInput) loginInput.value = '';
        if (passwordInput) passwordInput.value = '';
      } else {
        showToast('Credenciales incorrectas. Verifique su usuario o cédula y contraseña ingresada.', 'danger');
      }
    });
  }

  // --- MÓDULO DE CREACIÓN DE CUENTA (REGISTRO DE PACIENTE) ---
  setupPatientRegistration(showToast);

  // --- MÓDULO DE MODAL UNIFICADO DE AUTENTICACIÓN (NAVBAR & WIZARD) ---
  setupUnifiedLoginModal(showToast);
}

export function setupUnifiedLoginModal(showToast) {
  const modal = document.getElementById('modal-unified-login');
  if (!modal) return;

  const btnClose = document.getElementById('btn-close-unified-login-modal');
  const roleTabs = modal.querySelectorAll('.modal-role-tab-btn');
  const loginInput = document.getElementById('modal-login-username');
  const passwordInput = document.getElementById('modal-login-password');
  const passToggleBtn = document.getElementById('btn-modal-toggle-password');
  const form = document.getElementById('modal-unified-login-form');
  const btnOpenRegister = document.getElementById('btn-modal-open-register');
  const registerModal = document.getElementById('modal-register-patient');

  let currentSelectedRole = 'paciente';

  // Función para abrir el modal unificado y enfocar campo
  function openModal(role = 'paciente') {
    setRole(role);
    const loginModal = document.getElementById('modal-unified-login') || document.getElementById('modal-wizard-auth-gate') || document.getElementById('modal-auth') || modal;
    if (loginModal) {
      loginModal.classList.remove('hidden');
      loginModal.classList.add('active');
    }
    if (loginInput) {
      setTimeout(() => loginInput.focus(), 80);
    }
  }

  // Exponer al ámbito global para invocar desde cualquier módulo o script
  window.openUnifiedLoginModal = openModal;

  // Triggers para abrir el modal desde cualquier lugar (Navbar Landing, Navbar Paciente, Hero, Wizard, Footer)
  const openTriggers = [
    document.getElementById('btn-navbar-login-landing'),
    document.getElementById('btn-nav-login'),
    document.getElementById('btn-patient-open-login'),
    document.getElementById('btn-wizard-open-login'),
    document.getElementById('btn-hero-portal'),
    document.getElementById('footer-btn-portal'),
    document.getElementById('footer-btn-history'),
    ...Array.from(document.querySelectorAll('.btn-navbar-login, .btn-patient-nav-login'))
  ];

  const uniqueTriggers = Array.from(new Set(openTriggers.filter(Boolean)));
  uniqueTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Si el botón viene del enlace a portal de profesionales, cambiar rol a doctor
      if (btn.id === 'footer-btn-portal' || btn.id === 'btn-hero-portal') {
        openModal('doctor');
      } else {
        openModal('paciente');
      }
    });
  });

  // Cerrar modal con el botón de la esquina
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  function setRole(role) {
    currentSelectedRole = role;
    roleTabs.forEach(t => {
      if (t.dataset.role === role) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });
    if (loginInput) {
      if (role === 'doctor') {
        loginInput.placeholder = 'Cédula o Usuario del Doctor';
      } else if (role === 'paciente') {
        loginInput.placeholder = 'Cédula o Usuario del Paciente';
      } else {
        loginInput.placeholder = 'Cédula o Usuario Contable';
      }
    }
  }

  // Cambio interactivo de rol
  roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setRole(tab.dataset.role);
    });
  });

  // Botones de Autorelleno Rápido Demo (1 Clic)
  const demoBtns = modal.querySelectorAll('.btn-modal-demo-autofill');
  demoBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const role = btn.dataset.role;
      const user = btn.dataset.user;
      const pass = btn.dataset.pass;
      setRole(role);
      if (loginInput) loginInput.value = user;
      if (passwordInput) passwordInput.value = pass;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
  });

  // Mostrar / Ocultar contraseña
  if (passToggleBtn && passwordInput) {
    const eyeOpenSvg = `<svg class="eye-svg eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeClosedSvg = `<svg class="eye-svg eye-slashed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;

    passToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPass = passwordInput.getAttribute('type') === 'password';
      if (isPass) {
        passwordInput.setAttribute('type', 'text');
        passToggleBtn.innerHTML = eyeOpenSvg;
      } else {
        passwordInput.setAttribute('type', 'password');
        passToggleBtn.innerHTML = eyeClosedSvg;
      }
    });
  }

  // Abrir modal de registro de paciente desde el modal de login
  if (btnOpenRegister && registerModal) {
    btnOpenRegister.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.remove('active');
      registerModal.classList.add('active');
    });
  }

  // Enviar formulario modal
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredUser = (loginInput ? loginInput.value : '').trim().toLowerCase();
      const enteredPass = (passwordInput ? passwordInput.value : '').trim();

      if (!enteredUser || !enteredPass) {
        showToast('Por favor ingrese su usuario o cédula y su contraseña.', 'warning');
        return;
      }

      let matchedUser = null;

      // 1. Doctor
      const doc = DEMO_USERS.doctor;
      const isDoctorUser = (
        enteredUser === doc.username.toLowerCase() ||
        enteredUser === doc.email.toLowerCase() ||
        enteredUser === doc.idNumber ||
        enteredUser === doc.alternativeId ||
        enteredUser === '0930860044' ||
        enteredUser === '0928374651' ||
        enteredUser === 'carlos campoverde' ||
        enteredUser === 'campoverde' ||
        enteredUser === 'dr. campoverde' ||
        enteredUser === 'dr. carlos campoverde' ||
        (currentSelectedRole === 'doctor' && (enteredUser === 'doctor' || enteredUser === 'admin'))
      );
      const isDoctorPass = (
        enteredPass === doc.password ||
        enteredPass === doc.alternativePassword ||
        enteredPass === 'admin123' ||
        enteredPass === 'doctor123'
      );
      if (isDoctorUser && isDoctorPass) matchedUser = doc;

      // 2. Paciente
      if (!matchedUser) {
        const pat = DEMO_USERS.paciente;
        const isPatUser = (
          enteredUser === pat.username.toLowerCase() ||
          enteredUser === pat.email.toLowerCase() ||
          enteredUser === pat.idNumber ||
          enteredUser === 'carlos mendoza'
        );
        if (isPatUser && enteredPass === pat.password) matchedUser = pat;
      }

      // 3. Contadora
      if (!matchedUser) {
        const acc = DEMO_USERS.contador;
        const isAccUser = (
          enteredUser === acc.username.toLowerCase() ||
          enteredUser === acc.email.toLowerCase() ||
          enteredUser === acc.idNumber ||
          enteredUser === 'patricia morales'
        );
        if (isAccUser && enteredPass === acc.password) matchedUser = acc;
      }

      // 4. Búsqueda general
      if (!matchedUser) {
        for (const key in DEMO_USERS) {
          const u = DEMO_USERS[key];
          if (
            (u.username.toLowerCase() === enteredUser ||
             u.email.toLowerCase() === enteredUser ||
             u.idNumber === enteredUser) &&
            u.password === enteredPass
          ) {
            matchedUser = u;
            break;
          }
        }
      }

      if (matchedUser) {
        const roleLabelMap = {
          doctor: 'Médico',
          paciente: 'Paciente',
          contador: 'Contador(a)'
        };

        if (matchedUser.role !== currentSelectedRole) {
          const userRoleName = roleLabelMap[matchedUser.role] || matchedUser.role;
          const selectedRoleName = roleLabelMap[currentSelectedRole] || currentSelectedRole;
          showToast(`Acceso bloqueado: Esta cuenta pertenece al perfil de ${userRoleName}. Por favor seleccione la pestaña de "${selectedRoleName}" adecuada.`, 'danger');
          return;
        }

        // Éxito: cerrar modal y loguear
        modal.classList.remove('active');
        store.setCurrentUser(matchedUser);
        store.setActiveView(matchedUser.role);
        showToast(`Acceso exitoso. Bienvenido(a), ${matchedUser.name}`, 'success');

        window.scrollTo({ top: 0, behavior: 'instant' });
        if (loginInput) loginInput.value = '';
        if (passwordInput) passwordInput.value = '';
      } else {
        showToast('Credenciales incorrectas. Verifique los datos ingresados.', 'danger');
      }
    });
  }
}

function setupPatientRegistration(showToast) {
  const registerModal = document.getElementById('modal-register-patient');
  const btnOpenRegister = document.getElementById('btn-open-register-modal');
  const btnCloseRegister = document.getElementById('btn-close-register-modal');
  const registerForm = document.getElementById('form-register-patient');

  const formContainer = document.getElementById('register-form-container');
  const welcomeView = document.getElementById('register-welcome-view');
  const welcomeTitle = document.getElementById('reg-welcome-title');
  const welcomeSubtitle = document.getElementById('reg-welcome-subtitle');
  const welcomeActionBtn = document.getElementById('btn-reg-welcome-action');
  const btnSwitchLogin = document.getElementById('btn-switch-to-login');

  const idInput = document.getElementById('reg-pat-cedula') || document.getElementById('reg-pat-id');
  const idFeedback = document.getElementById('feedback-reg-cedula');

  const nameInput = document.getElementById('reg-pat-name') || document.getElementById('reg-pat-nombres');
  const nameFeedback = document.getElementById('feedback-reg-name');

  const phoneInput = document.getElementById('reg-pat-phone');
  const phoneFeedback = document.getElementById('feedback-reg-phone');

  const emailInput = document.getElementById('reg-pat-email');
  const emailFeedback = document.getElementById('feedback-reg-email');

  const passInput = document.getElementById('reg-pat-password');
  const passFeedback = document.getElementById('feedback-reg-password');
  const passToggleBtn = document.getElementById('btn-reg-toggle-password');

  const strengthSegs = [1, 2, 3, 4].map(i => document.getElementById(`strength-seg-${i}`));
  const strengthText = document.getElementById('reg-strength-text');

  // Helper para asignar estado visual y feedback inline a un campo
  function setInputFeedback(inputEl, feedbackEl, isValid, message) {
    if (!inputEl) return;
    if (isValid === null) {
      inputEl.classList.remove('input-error', 'input-valid');
      if (feedbackEl) {
        feedbackEl.textContent = '';
        feedbackEl.className = 'input-feedback';
      }
      return;
    }
    if (isValid) {
      inputEl.classList.remove('input-error');
      inputEl.classList.add('input-valid');
      if (feedbackEl) {
        feedbackEl.textContent = message || '';
        feedbackEl.className = 'input-feedback valid';
      }
    } else {
      inputEl.classList.remove('input-valid');
      inputEl.classList.add('input-error');
      if (feedbackEl) {
        feedbackEl.textContent = message || '';
        feedbackEl.className = 'input-feedback error';
      }
    }
  }

  // Helper para calcular fortaleza de contraseña (4 niveles según requerimientos)
  function calcularFortalezaPassword(pass) {
    if (!pass || pass.length === 0) {
      return { level: 0, text: 'Sin ingresar', color: '#94a3b8' };
    }
    const len = pass.length;
    const hasNumber = /\d/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasSymbol = /[^a-zA-Z0-9]/.test(pass);

    // Nivel 4 (≥ 8 caracteres + mayúsculas + minúsculas + números + símbolo): Color esmeralda (#10b981) ➔ "Fuerte / Segura"
    if (len >= 8 && hasUpper && hasLower && hasNumber && hasSymbol) {
      return { level: 4, text: 'Fuerte / Segura', color: '#10b981' };
    }
    // Nivel 3 (≥ 8 caracteres + números + mayúscula): Color amarillo/verde (#84cc16) ➔ "Aceptable"
    if (len >= 8 && hasNumber && hasUpper) {
      return { level: 3, text: 'Aceptable', color: '#84cc16' };
    }
    // Nivel 2 (≥ 6 caracteres + números): Color naranja (#f59e0b) ➔ "Débil"
    if (len >= 6 && hasNumber) {
      return { level: 2, text: 'Débil', color: '#f59e0b' };
    }
    // Nivel 1 (< 6 caracteres): Color rojo (#ef4444) ➔ "Muy débil"
    return { level: 1, text: 'Muy débil', color: '#ef4444' };
  }

  // Validador de celular de Ecuador (inicia con 09, 10 dígitos, sin secuencias repetitivas)
  function validarCelularEcuatorianoDetallado(phone) {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, message: 'El número celular es requerido.' };
    }
    const clean = phone.trim().replace(/\D/g, '');
    if (clean.length !== 10) {
      return { isValid: false, message: 'Ingresa un celular válido de Ecuador (inicia con 09, ej: 0991234567)' };
    }
    if (!clean.startsWith('09')) {
      return { isValid: false, message: 'Ingresa un celular válido de Ecuador (inicia con 09, ej: 0991234567)' };
    }
    const rest = clean.substring(2);
    if (/^(\d)\1+$/.test(rest) || /^(\d)\1+$/.test(clean)) {
      return { isValid: false, message: 'Ingresa un celular válido de Ecuador (inicia con 09, ej: 0991234567)' };
    }
    return { isValid: true, message: '✓ Celular válido' };
  }

  // Reset del modal al abrir
  function resetRegisterModal() {
    if (formContainer) {
      formContainer.style.display = 'block';
      formContainer.style.opacity = '1';
    }
    if (welcomeView) {
      welcomeView.style.display = 'none';
      welcomeView.style.opacity = '0';
    }
    if (registerForm) registerForm.reset();
    [idInput, nameInput, phoneInput, emailInput, passInput].forEach(inp => {
      if (inp) inp.classList.remove('input-error', 'input-valid');
    });
    [idFeedback, nameFeedback, phoneFeedback, emailFeedback, passFeedback].forEach(fb => {
      if (fb) {
        fb.textContent = '';
        fb.className = 'input-feedback';
      }
    });
    strengthSegs.forEach(seg => {
      if (seg) seg.style.background = '#e2e8f0';
    });
    if (strengthText) {
      strengthText.textContent = 'Sin ingresar';
      strengthText.style.color = '#94a3b8';
    }
  }

  // Triggers para abrir modal de registro
  const openTriggers = [
    btnOpenRegister,
    document.getElementById('btn-modal-open-register')
  ];

  openTriggers.forEach(btn => {
    if (btn && registerModal) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        resetRegisterModal();
        registerModal.classList.add('active');
      });
    }
  });

  // Cerrar modal
  if (btnCloseRegister && registerModal) {
    btnCloseRegister.addEventListener('click', () => {
      registerModal.classList.remove('active');
    });
  }

  // Switch a Login
  if (btnSwitchLogin && registerModal) {
    btnSwitchLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerModal.classList.remove('active');
      const loginModal = document.getElementById('modal-unified-login');
      if (loginModal) loginModal.classList.add('active');
    });
  }

  // Alternar visibilidad de contraseña (SVG eye)
  if (passToggleBtn && passInput) {
    const eyeOpenSvg = `<svg class="eye-svg eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeClosedSvg = `<svg class="eye-svg eye-slashed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;

    passToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPass = passInput.getAttribute('type') === 'password';
      if (isPass) {
        passInput.setAttribute('type', 'text');
        passToggleBtn.innerHTML = eyeOpenSvg;
      } else {
        passInput.setAttribute('type', 'password');
        passToggleBtn.innerHTML = eyeClosedSvg;
      }
    });
  }

  // 1. Cédula: sanitización y validación Módulo 10
  if (idInput) {
    idInput.setAttribute('maxlength', '10');
    idInput.setAttribute('inputmode', 'numeric');
    idInput.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').substring(0, 10);
      if (this.value.length === 10) {
        const check = validarCedulaEcuatorianaDetallada(this.value);
        if (check.isValid) {
          setInputFeedback(this, idFeedback, true, '✓ Cédula ecuatoriana válida');
        } else {
          setInputFeedback(this, idFeedback, false, 'Cédula ecuatoriana inválida (debe contener 10 dígitos válidos)');
        }
      } else {
        setInputFeedback(this, idFeedback, null);
      }
    });

    idInput.addEventListener('blur', function() {
      if (!this.value.trim()) {
        setInputFeedback(this, idFeedback, false, 'La cédula de identidad es obligatoria');
        return;
      }
      const check = validarCedulaEcuatorianaDetallada(this.value);
      if (check.isValid) {
        setInputFeedback(this, idFeedback, true, '✓ Cédula ecuatoriana válida');
      } else {
        setInputFeedback(this, idFeedback, false, 'Cédula ecuatoriana inválida (debe contener 10 dígitos válidos)');
      }
    });
  }

  // 2. Nombre y Apellido: bloqueo en tiempo real y mínimo 2 palabras
  if (nameInput) {
    nameInput.setAttribute('maxlength', '70');
    nameInput.addEventListener('input', function() {
      this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      const words = this.value.trim().split(/\s+/).filter(w => w.length >= 2);
      if (words.length >= 2) {
        setInputFeedback(this, nameFeedback, true, '✓ Nombre y apellido válidos');
      } else {
        setInputFeedback(this, nameFeedback, null);
      }
    });

    nameInput.addEventListener('blur', function() {
      if (!this.value.trim()) {
        setInputFeedback(this, nameFeedback, false, 'El nombre y apellido son obligatorios');
        return;
      }
      const check = validarNombreCompletoDetallado(this.value);
      if (check.isValid) {
        setInputFeedback(this, nameFeedback, true, '✓ Nombre y apellido válidos');
      } else {
        setInputFeedback(this, nameFeedback, false, 'Ingresa al menos un nombre y un apellido válidos (sin números ni símbolos)');
      }
    });
  }

  // 3. Teléfono: inicio con 09 y sin secuencias repetitivas
  if (phoneInput) {
    phoneInput.setAttribute('maxlength', '10');
    phoneInput.setAttribute('inputmode', 'numeric');
    phoneInput.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').substring(0, 10);
      if (this.value.length === 10) {
        const check = validarCelularEcuatorianoDetallado(this.value);
        if (check.isValid) {
          setInputFeedback(this, phoneFeedback, true, check.message);
        } else {
          setInputFeedback(this, phoneFeedback, false, check.message);
        }
      } else {
        setInputFeedback(this, phoneFeedback, null);
      }
    });

    phoneInput.addEventListener('blur', function() {
      if (!this.value.trim()) {
        setInputFeedback(this, phoneFeedback, false, 'El número celular es requerido');
        return;
      }
      const check = validarCelularEcuatorianoDetallado(this.value);
      if (check.isValid) {
        setInputFeedback(this, phoneFeedback, true, check.message);
      } else {
        setInputFeedback(this, phoneFeedback, false, check.message);
      }
    });
  }

  // 4. Correo electrónico: estructura de email válida
  if (emailInput) {
    emailInput.addEventListener('input', function() {
      const trimmed = this.value.trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setInputFeedback(this, emailFeedback, true, '✓ Correo electrónico válido');
      } else {
        setInputFeedback(this, emailFeedback, null);
      }
    });

    emailInput.addEventListener('blur', function() {
      if (!this.value.trim()) {
        setInputFeedback(this, emailFeedback, false, 'El correo electrónico es requerido');
        return;
      }
      const check = validarEmailDetallado(this.value);
      if (check.isValid) {
        setInputFeedback(this, emailFeedback, true, '✓ Correo electrónico válido');
      } else {
        setInputFeedback(this, emailFeedback, false, 'Ingresa un correo electrónico válido');
      }
    });
  }

  // 5. Contraseña: barra de fortaleza reactiva
  if (passInput) {
    passInput.addEventListener('input', function() {
      const val = this.value;
      const strength = calcularFortalezaPassword(val);
      if (strengthText) {
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
      }
      strengthSegs.forEach((seg, idx) => {
        if (!seg) return;
        if (idx < strength.level) {
          seg.style.background = strength.color;
        } else {
          seg.style.background = '#e2e8f0';
        }
      });
      if (val.length >= 6) {
        setInputFeedback(this, passFeedback, true, `✓ Fortaleza: ${strength.text}`);
      } else if (val.length > 0) {
        setInputFeedback(this, passFeedback, false, 'La contraseña debe tener al menos 6 caracteres');
      } else {
        setInputFeedback(this, passFeedback, null);
      }
    });

    passInput.addEventListener('blur', function() {
      if (!this.value) {
        setInputFeedback(this, passFeedback, false, 'La contraseña de acceso es requerida');
      } else if (this.value.length < 6) {
        setInputFeedback(this, passFeedback, false, 'La contraseña debe tener al menos 6 caracteres');
      }
    });
  }

  // Enviar formulario de registro con control de 1 solo Toast
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameVal = nameInput ? nameInput.value.trim() : '';
      const idVal = idInput ? idInput.value.trim() : '';
      const phoneVal = phoneInput ? phoneInput.value.trim() : '';
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const passVal = passInput ? passInput.value.trim() : '';

      let firstInvalidInput = null;

      // Validación Cédula
      const cedulaCheck = validarCedulaEcuatorianaDetallada(idVal);
      if (!cedulaCheck.isValid) {
        setInputFeedback(idInput, idFeedback, false, 'Cédula ecuatoriana inválida (debe contener 10 dígitos válidos)');
        if (!firstInvalidInput) firstInvalidInput = idInput;
      } else {
        setInputFeedback(idInput, idFeedback, true, '✓ Cédula ecuatoriana válida');
      }

      // Validación Nombre
      const nameCheck = validarNombreCompletoDetallado(nameVal);
      if (!nameCheck.isValid) {
        setInputFeedback(nameInput, nameFeedback, false, 'Ingresa al menos un nombre y un apellido válidos (sin números ni símbolos)');
        if (!firstInvalidInput) firstInvalidInput = nameInput;
      } else {
        setInputFeedback(nameInput, nameFeedback, true, '✓ Nombre y apellido válidos');
      }

      // Validación Celular
      const phoneCheck = validarCelularEcuatorianoDetallado(phoneVal);
      if (!phoneCheck.isValid) {
        setInputFeedback(phoneInput, phoneFeedback, false, phoneCheck.message);
        if (!firstInvalidInput) firstInvalidInput = phoneInput;
      } else {
        setInputFeedback(phoneInput, phoneFeedback, true, phoneCheck.message);
      }

      // Validación Email
      const emailCheck = validarEmailDetallado(emailVal);
      if (!emailCheck.isValid) {
        setInputFeedback(emailInput, emailFeedback, false, 'Ingresa un correo electrónico válido');
        if (!firstInvalidInput) firstInvalidInput = emailInput;
      } else {
        setInputFeedback(emailInput, emailFeedback, true, '✓ Correo electrónico válido');
      }

      // Validación Contraseña
      if (passVal.length < 6) {
        setInputFeedback(passInput, passFeedback, false, 'La contraseña debe tener al menos 6 caracteres');
        if (!firstInvalidInput) firstInvalidInput = passInput;
      } else {
        const strength = calcularFortalezaPassword(passVal);
        setInputFeedback(passInput, passFeedback, true, `✓ Fortaleza: ${strength.text}`);
      }

      // Si algún campo falló, enfocar el primero y emitir exactamente UN toast informativo
      if (firstInvalidInput) {
        firstInvalidInput.focus();
        showToast('Por favor verifica los campos marcados en rojo.', 'warning');
        return;
      }

      // Comprobar duplicidad
      for (const k in DEMO_USERS) {
        if (DEMO_USERS[k].idNumber === idVal) {
          setInputFeedback(idInput, idFeedback, false, 'Ya existe una cuenta con esta cédula de identidad');
          idInput.focus();
          showToast('Ya existe una cuenta registrada con esta cédula.', 'warning');
          return;
        }
        if (DEMO_USERS[k].email && DEMO_USERS[k].email.toLowerCase() === emailVal.toLowerCase()) {
          setInputFeedback(emailInput, emailFeedback, false, 'Ya existe una cuenta con este correo electrónico');
          emailInput.focus();
          showToast('Ya existe una cuenta registrada con este correo.', 'warning');
          return;
        }
      }

      // Crear nuevo usuario de Paciente
      const userKey = `paciente_${idVal}`;
      const newPatientUser = {
        role: 'paciente',
        name: nameVal,
        email: emailVal,
        username: idVal,
        idNumber: idVal,
        password: passVal,
        phone: phoneVal,
        allergies: 'Sin alergias declaradas',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      };

      DEMO_USERS[userKey] = newPatientUser;

      // Registrar o actualizar perfil del paciente en el store
      if (store.savePatientProfile) {
        store.savePatientProfile({
          cedula: idVal,
          nombres: nameVal.split(' ')[0] || nameVal,
          apellidos: nameVal.split(' ').slice(1).join(' ') || '',
          telefono: phoneVal,
          email: emailVal,
          direccion: 'Guayaquil, Ecuador',
          tipo_sangre: 'O+',
          alergias: 'Sin alergias declaradas',
          enfermedades_cronicas: 'Ninguna reportada',
          medicacion_habitual: 'Ninguna'
        });
      }

      // Iniciar sesión
      store.setCurrentUser(newPatientUser);

      // Transición suave a la vista de Onboarding / Bienvenida
      if (formContainer && welcomeView) {
        formContainer.style.transition = 'opacity 0.25s ease';
        formContainer.style.opacity = '0';
        setTimeout(() => {
          formContainer.style.display = 'none';
          welcomeView.style.display = 'block';
          welcomeView.style.opacity = '0';
          welcomeView.style.transition = 'opacity 0.35s ease';

          if (welcomeTitle) {
            welcomeTitle.textContent = `¡Bienvenido a Montepiedra Salud, ${nameVal}!`;
          }

          // Verificar si venía con reserva en curso
          const pendingDraft = sessionStorage.getItem('montepiedra_pending_booking');
          if (pendingDraft && welcomeActionBtn) {
            welcomeActionBtn.textContent = '📅 Continuar con mi Cita Agendada →';
            welcomeActionBtn.onclick = async () => {
              registerModal.classList.remove('active');
              if (window.confirmAndCreateAppointment) {
                await window.confirmAndCreateAppointment(newPatientUser);
              } else {
                window.dispatchEvent(new CustomEvent('montepiedra:confirmPendingBooking', { detail: { user: newPatientUser } }));
              }
            };
          } else if (welcomeActionBtn) {
            welcomeActionBtn.textContent = 'Ir a mi Portal de Paciente →';
            welcomeActionBtn.onclick = () => {
              registerModal.classList.remove('active');
              store.setActiveView('paciente');
              showToast(`¡Sesión iniciada con éxito! Bienvenido(a), ${nameVal}.`, 'success');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            };
          }

          setTimeout(() => {
            welcomeView.style.opacity = '1';
          }, 30);
        }, 250);
      } else {
        registerModal.classList.remove('active');
        store.setActiveView('paciente');
        showToast(`¡Cuenta creada con éxito! Bienvenido(a), ${nameVal}.`, 'success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}

/**
 * Servicio Centralizado de Autenticación para integración en Wizards y Modales
 */
export const authService = {
  getCurrentUser() {
    return store.getCurrentUser();
  },

  async login(userOrCedula, password) {
    const enteredUser = (userOrCedula || '').trim().toLowerCase();
    const enteredPass = (password || '').trim();

    if (!enteredUser || !enteredPass) {
      return { success: false, error: 'Por favor ingrese su usuario o cédula y su contraseña.' };
    }

    // 1. Paciente demo
    const pat = DEMO_USERS.paciente;
    let matchedUser = null;
    if (
      (enteredUser === pat.username.toLowerCase() ||
       enteredUser === pat.email.toLowerCase() ||
       enteredUser === pat.idNumber ||
       enteredUser === 'carlos mendoza') &&
      enteredPass === pat.password
    ) {
      matchedUser = pat;
    }

    // 2. Otros usuarios del sistema
    if (!matchedUser) {
      for (const k in DEMO_USERS) {
        const u = DEMO_USERS[k];
        if (
          (u.username && u.username.toLowerCase() === enteredUser) ||
          (u.email && u.email.toLowerCase() === enteredUser) ||
          (u.idNumber && u.idNumber === enteredUser)
        ) {
          if (u.password === enteredPass) {
            matchedUser = u;
            break;
          }
        }
      }
    }

    if (matchedUser) {
      if (matchedUser.role !== 'paciente') {
        return { success: false, error: 'Esta cuenta pertenece a otro rol del sistema. Ingrese con una cuenta de paciente.' };
      }
      store.setCurrentUser(matchedUser);
      return { success: true, user: matchedUser };
    }

    return { success: false, error: 'Credenciales incorrectas. Verifique su cédula/correo y contraseña.' };
  },

  async registerPatient(userData) {
    const { name, idNumber, phone, email, password } = userData;
    const nameVal = (name || '').trim();
    const idVal = (idNumber || '').trim();
    const phoneVal = (phone || '').trim();
    const emailVal = (email || '').trim();
    const passVal = (password || '').trim();

    if (!nameVal || !idVal || !phoneVal || !emailVal || !passVal) {
      return { success: false, error: 'Por favor complete todos los campos obligatorios.' };
    }

    // Validar Nombre y Apellido completo (mínimo 2 palabras, sin números ni símbolos)
    const nameCheck = validarNombreCompletoDetallado(nameVal);
    if (!nameCheck.isValid) {
      return { success: false, error: nameCheck.message };
    }

    // Validar Cédula Ecuatoriana (Módulo 10)
    const cedulaCheck = validarCedulaEcuatorianaDetallada(idVal);
    if (!cedulaCheck.isValid) {
      return { success: false, error: 'Cédula incorrecta. Verifique los 10 dígitos ingresados.' };
    }

    // Validar Celular (10 dígitos con 09)
    const phoneCheck = validarCelularDetallado(phoneVal);
    if (!phoneCheck.isValid) {
      return { success: false, error: phoneCheck.message };
    }

    // Validar Email
    const emailCheck = validarEmailDetallado(emailVal);
    if (!emailCheck.isValid) {
      return { success: false, error: emailCheck.message };
    }

    // Validar contraseña
    if (passVal.length < 4) {
      return { success: false, error: 'La clave de acceso debe contener al menos 4 caracteres.' };
    }

    // Comprobar existencia previa
    for (const k in DEMO_USERS) {
      if (DEMO_USERS[k].idNumber === idVal || (DEMO_USERS[k].email && DEMO_USERS[k].email.toLowerCase() === emailVal.toLowerCase())) {
        return { success: false, error: 'Ya existe una cuenta registrada con esta cédula o correo electrónico.' };
      }
    }

    const newPatientUser = {
      role: 'paciente',
      name: nameVal,
      email: emailVal,
      username: idVal,
      idNumber: idVal,
      password: passVal,
      phone: phoneVal,
      allergies: 'Sin alergias declaradas',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    };

    DEMO_USERS[`paciente_${idVal}`] = newPatientUser;

    // Guardar perfil de paciente
    if (store.savePatientProfile) {
      store.savePatientProfile({
        cedula: idVal,
        nombres: nameVal.split(' ')[0] || nameVal,
        apellidos: nameVal.split(' ').slice(1).join(' ') || '',
        telefono: phoneVal,
        email: emailVal,
        direccion: 'Guayaquil, Ecuador',
        tipo_sangre: 'O+',
        alergias: 'Sin alergias declaradas',
        enfermedades_cronicas: 'Ninguna reportada',
        medicacion_habitual: 'Ninguna'
      });
    }

    // Iniciar sesión inmediatamente
    store.setCurrentUser(newPatientUser);
    return { success: true, user: newPatientUser };
  }
};

if (typeof window !== 'undefined') {
  window.authService = authService;
}

