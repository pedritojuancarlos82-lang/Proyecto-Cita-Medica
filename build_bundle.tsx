/**
 * build_bundle.tsx
 * Compilador y Empaquetador TypeScript / TSX de la Suite de Producción
 * Montepiedra Salud - Sistema de Bundling Front-end
 */

export interface BundleManifest {
  name: string;
  files: string[];
  outputPath: string;
  totalChars?: number;
  timestamp?: string;
}

export const DEFAULT_BUNDLE_FILES: string[] = [
  'js/supabase-config.js',
  'js/supabase-client.js',
  'js/qr-generator.js',
  'js/data/consultation-catalog.js',
  'js/catalogo-motivos.js',
  'js/models/patient-record.js',
  'js/services/medical-service.js',
  'js/services/collision-engine.js',
  'js/services/qr-token-service.js',
  'js/services/email-service.js',
  'js/validaciones-globales.js',
  'js/ambient-background.js',
  'js/state.js',
  'js/auth.js',
  'js/patient.js',
  'js/doctor.js',
  'js/accountant.js',
  'js/app.js'
];

export const processCodeBundle = (sourceContents: Record<string, string>): string => {
  const combined: string[] = [
    '// Montepiedra Salud - Bundle Unificado de Producción (Compatible con file:/// y http://)\n'
  ];

  for (const [filepath, rawContent] of Object.entries(sourceContents)) {
    let content = rawContent;
    // Eliminar sentencias import
    content = content.replace(/import\s+[\s\S]*?from\s+['"][^'"]*?['"];?\n?/g, '');
    content = content.replace(/import\s+['"][^'"]*?['"];?\n?/g, '');

    // Eliminar palabras clave export
    content = content.replace(/export\s+default\s+/g, '');
    content = content.replace(/export\s+async\s+function\s+/g, 'async function ');
    content = content.replace(/export\s+(const|let|var|function|class)\s+/g, '$1 ');
    content = content.replace(/export\s*\{[\s\S]*?\};?\n?/g, '');

    // Limpiar logs de depuración
    content = content.replace(/^\s*console\.log\([^;]*\);?\s*$/gm, '');

    combined.push(`\n// ==================== ${filepath} ====================\n`);
    combined.push(content);
  }

  return combined.join('\n');
};

export default { DEFAULT_BUNDLE_FILES, processCodeBundle };
