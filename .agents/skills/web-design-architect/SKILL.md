---
name: web-design-architect
description: Audita, refactoriza y moderniza interfaces web front-end, estilos CSS, sistemas de diseño y componentes UI interactivos. Usar cuando se requiera mejorar el diseño visual, hacer la plataforma más dinámica, profesional y accesible.
---

# Web Design Architect Skill

Guía y estándares técnicos para transformar plataformas web tradicionales en aplicaciones digitales modernas, dinámicas y de nivel profesional.

## Cuándo activar esta skill
- Cuando el usuario solicite rediseñar, modernizar o mejorar la UI/UX de una web o portal.
- Al refactorizar estilos CSS dispersos a un sistema de tokens y variables centralizadas.
- Para rediseñar flujos de formularios, dashboards médicos, calendarios o tablas de datos.
- Para implementar microinteracciones, estados interactivos (hover, active, focus) y transiciones fluidas.

---

## 1. Sistema de Tokens y Variables Globales (CSS `:root`)
Toda intervención debe basarse en un núcleo de variables consistente en `main.css`:

```css
:root {
  /* Paleta Base Salud / SaaS Moderno */
  --bg-main: #f8fafc;
  --bg-surface: #ffffff;
  --bg-surface-elevated: #ffffff;
  --border-subtle: rgba(15, 23, 42, 0.08);
  --border-focus: #2563eb;

  /* Colores de Marca y Estados */
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-light: #eff6ff;
  --accent-teal: #0d9488;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;

  /* Tipografía y Escala */
  --font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
  --text-main: #0f172a;
  --text-muted: #475569;
  --text-subtle: #94a3b8;

  /* Elevaciones y Bordes */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06);
  --shadow-card: 0 8px 24px -6px rgba(15, 23, 42, 0.08);
  --shadow-card-hover: 0 16px 32px -8px rgba(15, 23, 42, 0.12);

  /* Transición estándar */
  --transition-smooth: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 2. Principios de Arquitectura Visual y UI

1. **Jerarquía Visual Inmediata**:
   - Cada sección debe contar con un foco de atención claro mediante contrastes de peso tipográfico, tamaño y color.
   - Los títulos principales (`h1`, `h2`) deben transmitir solidez y confianza, acompañados de subtítulos legibles y descriptivos.

2. **Diseño de Componentes Modulares**:
   - Evitar estilos inline repetitivos; extraer patrones a clases utilitarias o bloques BEM/semánticos (`.card`, `.btn-primary`, `.badge`, `.table-modern`).
   - Mantener consistencia en espaciados (márgenes y paddings basados en múltiplos de 4px u 8px).

3. **Microinteracciones y Estados de Interacción**:
   - Todo elemento accionable (`button`, `a`, `input`, `.card-interactive`) debe tener definidos sus estados:
     - **Hover**: Elevación ligera (`translateY(-2px)` o `-3px`), cambio de sombra y saturación.
     - **Focus-visible**: Anillo de foco accesible con contraste mínimo WCAG (`box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2)`).
     - **Active**: Respuesta táctil inmediata (`transform: scale(0.98)`).
     - **Disabled**: Reducción de opacidad al 50% y `cursor: not-allowed`.

4. **Accesibilidad (a11y) y Legibilidad**:
   - Contraste de texto mínimo de 4.5:1 para texto normal y 3:1 para texto grande según pautas WCAG 2.1 AA.
   - Indicadores semánticos no dependientes exclusivamente del color (ej. iconos junto a alertas de error o éxito).

---

## 3. Protocolo de Auditoría y Modernización Front-End

Cuando se ejecute una refactorización de interfaz:
1. **Auditar el CSS existente**: Identificar colores quemados (*hardcoded*), fuentes desalineadas y sombras inconsistentes.
2. **Homogeneizar con Tokens**: Reemplazar valores fijos por variables CSS centralizadas del `:root`.
3. **Optimizar Formularios e Inputs**:
   - Agregar iconos contextuales.
   - Mejorar placeholders y labels flotantes o accesibles.
   - Validaciones en vivo con retroalimentación visual clara.
4. **Refinar Tablas y Paneles de Datos**:
   - Filas con efecto cebra o hover suave.
   - Encabezados pegajosos (*sticky header*) si aplican scrolls largos.
   - Badges de estado con contrastes calibrados.
5. **Validar la Responsividad**:
   - Probar en vista móvil (390px - 480px), tablet (768px - 1024px) y desktop (1280px+).
