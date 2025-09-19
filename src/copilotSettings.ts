// Runtime configuration loaded from environment variables (via Vite import.meta.env) or left blank.
// REAL VALUES SHOULD BE PROVIDED THROUGH .env (see .env.example) OR CI PIPELINE INJECTION.
// This file intentionally contains no secrets or tenant-identifying GUIDs.

interface ViteEnv {
  [key: string]: string | boolean | undefined;
}
// Narrowed helper to safely read string env vars.
const env = (name: string): string => {
  const v = (import.meta as unknown as { env: ViteEnv }).env?.[name];
  return typeof v === 'string' ? v : '';
};

export const copilotSettings = {
  appClientId: env('VITE_COPILOT_APP_CLIENT_ID'),
  tenantId: env('VITE_COPILOT_TENANT_ID'),
  environmentId: env('VITE_COPILOT_ENVIRONMENT_ID'),
  agentIdentifier: env('VITE_COPILOT_AGENT_IDENTIFIER'),
  directConnectUrl: env('VITE_COPILOT_DIRECT_CONNECT_URL')
};
