/**
 * Montepiedra Salud - Motor de Fondo Difuminado Neutro con Iluminación Líquida
 * 
 * Estética Minimalista:
 * - Decoloración difuminada continua entre tonos neutros (Obsidian, Pizarra, Titanio, Mineral Teal, Grafito).
 * - Interacción con el ratón: Haz de luz ambiental fluido (Dynamic Ambient Spotlight)
 *   que se desliza suavemente con inercia líquida detrás del contenido e ilumina el cristal.
 * - Sin constelaciones ni líneas molestas, sin tambaleos 3D de textos. Puro lujo visual.
 */

(function () {
  'use strict';

  function initAmbientBackground() {
    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.__ambientRunning) return;
    canvas.__ambientRunning = true;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Estado del cursor con inercia elástica ultrasuave
    const mouse = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.35,
      targetX: window.innerWidth * 0.5,
      targetY: window.innerHeight * 0.35,
      vx: 0,
      vy: 0,
      intensity: 0.85,
      targetIntensity: 0.85,
      radius: 380
    };

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Seguimiento del mouse
    window.addEventListener('mousemove', function (e) {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.targetIntensity = 1.0;

      // Iluminación dinámica en tarjetas sobrevoladas (Apple/Linear spotlight border)
      const targetCard = e.target.closest('.featured-clinic-card, .how-step-card, .login-card-container, .patient-summary-card, .doctor-stat-box, .stat-item, .faq-item');
      if (targetCard) {
        const rect = targetCard.getBoundingClientRect();
        targetCard.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
        targetCard.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
      }
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.targetIntensity = 1.0;
      }
    }, { passive: true });

    window.addEventListener('mouseleave', function () {
      mouse.targetIntensity = 0.5;
    }, { passive: true });

    // Orbes de colores neutros con movimiento orgánico y difuminado profundo
    const neutralOrbs = [
      {
        baseX: 0.15, baseY: 0.25,
        radius: 650,
        speedX: 0.0006, speedY: 0.0008,
        phase: 0,
        // Titanio Carbón Pizarra
        r: 30, g: 41, b: 59, a: 0.55
      },
      {
        baseX: 0.85, baseY: 0.20,
        radius: 680,
        speedX: -0.0007, speedY: 0.0006,
        phase: Math.PI * 0.4,
        // Mineral Teal Silencioso (Salud y Energía orgánica)
        r: 13, g: 148, b: 136, a: 0.35
      },
      {
        baseX: 0.50, baseY: 0.65,
        radius: 720,
        speedX: 0.0008, speedY: -0.0006,
        phase: Math.PI * 0.9,
        // Grafito Acero Profundo
        r: 15, g: 23, b: 42, a: 0.65
      },
      {
        baseX: 0.18, baseY: 0.80,
        radius: 600,
        speedX: -0.0005, speedY: -0.0007,
        phase: Math.PI * 1.3,
        // Pizarra Azulada Neutra
        r: 51, g: 65, b: 85, a: 0.45
      },
      {
        baseX: 0.82, baseY: 0.82,
        radius: 640,
        speedX: 0.0006, speedY: 0.0005,
        phase: Math.PI * 1.7,
        // Acento Platino Suave
        r: 71, g: 85, b: 105, a: 0.40
      }
    ];

    let time = 0;
    let animId = null;

    function render() {
      time += 0.014;

      // Suavizado elástico de la posición del haz de luz (Inercia fluida)
      mouse.vx = (mouse.targetX - mouse.x) * 0.075;
      mouse.vy = (mouse.targetY - mouse.y) * 0.075;
      mouse.x += mouse.vx;
      mouse.y += mouse.vy;

      mouse.intensity += (mouse.targetIntensity - mouse.intensity) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // CAPA 1: Decoloración difuminada entre orbes neutros
      for (let i = 0; i < neutralOrbs.length; i++) {
        const orb = neutralOrbs[i];
        
        // Movimiento senoidal orgánico
        let cx = (orb.baseX + Math.sin(time * 0.6 + orb.phase) * 0.16) * width;
        let cy = (orb.baseY + Math.cos(time * 0.5 + orb.phase) * 0.16) * height;

        // Atracción magnética sutil hacia el haz de luz del ratón
        const dx = mouse.x - cx;
        const dy = mouse.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < 600) {
          const pull = (1 - dist / 600) * 45;
          cx += (dx / dist) * pull;
          cy += (dy / dist) * pull;
        }

        const r = orb.radius + Math.sin(time * 0.8 + orb.phase) * 50;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(${orb.r}, ${orb.g}, ${orb.b}, ${orb.a})`);
        grad.addColorStop(0.55, `rgba(${orb.r}, ${orb.g}, ${orb.b}, ${orb.a * 0.45})`);
        grad.addColorStop(1, `rgba(${orb.r}, ${orb.g}, ${orb.b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // CAPA 2: Haz de Luz Líquido Interactivo (Dynamic Ambient Mouse Spotlight)
      // Un resplandor difuminado que sigue al cursor suavemente iluminando el fondo
      if (mouse.intensity > 0.05) {
        const speed = Math.hypot(mouse.vx, mouse.vy);
        const dynamicRadius = mouse.radius + Math.min(speed * 6, 120);

        // Halo Exterior Difuminado (Teal Orgánico + Pizarra)
        const outerGrad = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, dynamicRadius
        );
        outerGrad.addColorStop(0, `rgba(13, 148, 136, ${0.28 * mouse.intensity})`);
        outerGrad.addColorStop(0.35, `rgba(45, 212, 191, ${0.12 * mouse.intensity})`);
        outerGrad.addColorStop(0.70, `rgba(30, 41, 59, ${0.08 * mouse.intensity})`);
        outerGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');

        ctx.fillStyle = outerGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, dynamicRadius, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo Interior de Luz Platino Suave (Luminescence)
        const innerRadius = dynamicRadius * 0.42;
        const innerGrad = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, innerRadius
        );
        innerGrad.addColorStop(0, `rgba(241, 245, 249, ${0.22 * mouse.intensity})`);
        innerGrad.addColorStop(0.5, `rgba(203, 213, 225, ${0.08 * mouse.intensity})`);
        innerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, innerRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    }

    render();
  }

  // Exportar al ámbito global y autoiniciar
  if (typeof window !== 'undefined') {
    window.initAmbientBackground = initAmbientBackground;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAmbientBackground);
    } else {
      initAmbientBackground();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initAmbientBackground };
  }
})();
