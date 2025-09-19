#!/usr/bin/env node
/*
 Simple environment validation.
 - Only enforces Copilot variables if VITE_FEATURE_CHAT == '1'.
 - Never prints secret values, only variable names.
*/
const requiredBase = [];
const requiredChat = [
  'VITE_COPILOT_APP_CLIENT_ID',
  'VITE_COPILOT_TENANT_ID',
  // At least one of these two strategies must be present
  // (environment+agent OR direct connect URL)
];

function has(val) {
  const raw = process.env[val];
  return typeof raw === 'string' && raw.trim().length > 0;
}

const missing = [];

for (const v of requiredBase) if (!has(v)) missing.push(v);

const featureChat = process.env.VITE_FEATURE_CHAT === '1';
if (featureChat) {
  for (const v of requiredChat) if (!has(v)) missing.push(v);
  const hasEnvAgent = has('VITE_COPILOT_ENVIRONMENT_ID') && has('VITE_COPILOT_AGENT_IDENTIFIER');
  const hasDirect = has('VITE_COPILOT_DIRECT_CONNECT_URL');
  if (!hasEnvAgent && !hasDirect) {
    missing.push('VITE_COPILOT_ENVIRONMENT_ID+VITE_COPILOT_AGENT_IDENTIFIER OR VITE_COPILOT_DIRECT_CONNECT_URL');
  }
}

if (missing.length) {
  console.error('\n[env] Missing required variables:');
  for (const m of missing) console.error('  - ' + m);
  console.error('\nAdd them to your .env (see .env.example).');
  process.exit(1);
} else {
  console.log('[env] All required environment variables present for current feature flags.');
}