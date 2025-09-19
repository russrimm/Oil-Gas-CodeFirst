// Copy this file to copilotSettings.ts and fill in your values.
// Option 1 (Environment + Agent Identifier)
export const copilotSettings = {
  appClientId: 'YOUR_AAD_APP_CLIENT_ID',
  tenantId: 'YOUR_TENANT_ID',
  environmentId: 'YOUR_POWER_PLATFORM_ENV_ID',
  agentIdentifier: 'YOUR_AGENT_SCHEMA_NAME',
  directConnectUrl: '' // leave blank when using environmentId+agentIdentifier
};

// Option 2 (Direct Connect URL) – comment Option 1 and use this instead:
// export const copilotSettings = {
//   appClientId: 'YOUR_AAD_APP_CLIENT_ID',
//   tenantId: 'YOUR_TENANT_ID',
//   directConnectUrl: 'DIRECT_CONNECT_URL_FROM_CHANNELS',
// };
