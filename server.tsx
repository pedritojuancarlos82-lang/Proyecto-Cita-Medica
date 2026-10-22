/**
 * server.tsx
 * Configuración de Servidor de Aplicación Web y Control de Headers
 * Montepiedra Salud - Entorno de Ejecución Local y Despliegue
 */

export interface ServerConfig {
  host: string;
  port: number;
  corsEnabled: boolean;
  cacheControl: string;
}

export const DEFAULT_SERVER_CONFIG: ServerConfig = {
  host: '0.0.0.0',
  port: 8080,
  corsEnabled: true,
  cacheControl: 'no-cache, no-store, must-revalidate'
};

export const getSecurityHeaders = (): Record<string, string> => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'X-Content-Type-Options': 'nosniff'
});

export const getServerUrl = (config: ServerConfig = DEFAULT_SERVER_CONFIG): string => {
  return `http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}/`;
};

export default DEFAULT_SERVER_CONFIG;
