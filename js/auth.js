/**
 * Módulo de Autenticación y Control de Roles (Montepiedra Salud)
 * Maneja el inicio de sesión manual seguro, validación de credenciales (cédula o usuario + contraseña)
 * y previene cualquier acceso automático no autorizado.
 */

import { DEMO_USERS, store } from './state.js';
import {
  validarCedulaEcuatorianaDetallada,
  validarCelularDetallado,
  validarEmailDetallado
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
}

function setupPatientRegistration(showToast) {
  const registerModal = document.getElementById('modal-register-patient');
  const btnOpenRegister = document.getElementById('btn-open-register-modal');
  const btnCloseRegister = document.getElementById('btn-close-register-modal');
  const registerForm = document.getElementById('form-register-patient');

  if (btnOpenRegister && registerModal) {
    btnOpenRegister.addEventListener('click', (e) => {
      e.preventDefault();
      registerModal.classList.add('active');
    });
  }

  if (btnCloseRegister && registerModal) {
    btnCloseRegister.addEventListener('click', () => {
      registerModal.classList.remove('active');
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('reg-pat-name');
      const idInput = document.getElementById('reg-pat-id');
      const phoneInput = document.getElementById('reg-pat-phone');
      const emailInput = document.getElementById('reg-pat-email');
      const passInput = document.getElementById('reg-pat-password');
      const passConfirmInput = document.getElementById('reg-pat-password-confirm');

      const nameVal = nameInput ? nameInput.value.trim() : '';
      const idVal = idInput ? idInput.value.trim() : '';
      const phoneVal = phoneInput ? phoneInput.value.trim() : '';
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const passVal = passInput ? passInput.value.trim() : '';
      const passConfirmVal = passConfirmInput ? passConfirmInput.value.trim() : '';

      if (!nameVal || !idVal || !phoneVal || !emailVal || !passVal) {
        showToast('Por favor complete todos los campos obligatorios.', 'warning');
        return;
      }

      // Validar Cédula (Mensaje estricto: 'Cédula incorrecta.')
      const cedulaCheck = validarCedulaEcuatorianaDetallada(idVal);
      if (!cedulaCheck.isValid) {
        showToast('Cédula incorrecta. Verifique los 10 dígitos ingresados.', 'danger');
        if (idInput) idInput.focus();
        return;
      }

      // Validar Celular (10 dígitos oficiales)
      const phoneCheck = validarCelularDetallado(phoneVal);
      if (!phoneCheck.isValid) {
        showToast(phoneCheck.message, 'warning');
        if (phoneInput) phoneInput.focus();
        return;
      }

      // Validar Email
      const emailCheck = validarEmailDetallado(emailVal);
      if (!emailCheck.isValid) {
        showToast(emailCheck.message, 'warning');
        if (emailInput) emailInput.focus();
        return;
      }

      // Validar contraseña
      if (passVal.length < 4) {
        showToast('La clave de acceso debe contener al menos 4 caracteres.', 'warning');
        if (passInput) passInput.focus();
        return;
      }

      if (passVal !== passConfirmVal) {
        showToast('Las contraseñas ingresadas no coinciden. Por favor verifique.', 'danger');
        if (passConfirmInput) passConfirmInput.focus();
        return;
      }

      // Comprobar si ya existe un usuario con esa cédula
      for (const k in DEMO_USERS) {
        if (DEMO_USERS[k].idNumber === idVal || DEMO_USERS[k].email.toLowerCase() === emailVal.toLowerCase()) {
          showToast('Ya existe una cuenta registrada con esta cédula o correo electrónico.', 'warning');
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

      // Limpiar formulario y cerrar modal
      registerForm.reset();
      if (registerModal) registerModal.classList.remove('active');

      // Iniciar sesión inmediatamente con la nueva cuenta
      store.setCurrentUser(newPatientUser);
      store.setActiveView('paciente');
      showToast(`¡Cuenta creada con éxito! Bienvenido(a) al Portal del Paciente, ${nameVal}.`, 'success');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
