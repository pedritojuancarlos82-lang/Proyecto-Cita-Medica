/**
 * Montepiedra Salud - Configuración de Credenciales de Supabase
 * Contiene la URL y la llave pública (Anon / Publishable) para el navegador.
 */

export const SUPABASE_CONFIG = {
  // URL oficial del proyecto en Supabase
  url: 'https://spzyhpdhvqqdyyxqmxav.supabase.co',
  
  // Clave pública (Publishable Key / Anon) - Segura para el navegador con RLS
  publishableKey: 'sb_publishable_zXgeds1KH5FZtPYWRAGnew_TsT5sf90',

  // Helper para verificar si la URL configurada es válida
  isConfigured() {
    return !!this.url && !!this.publishableKey;
  }
};

