import type { ConnectionSettings } from '@microsoft/agents-copilotstudio-client';

let cached: ConnectionSettings | null = null;
let inflight: Promise<ConnectionSettings> | null = null;

async function internalLoad(): Promise<ConnectionSettings> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
  // @ts-expect-error dynamic optional JS module provided by user; TS may not find declaration
      const mod = await import('./copilotSettings.ts');
      const found = (mod as { copilotSettings?: ConnectionSettings }).copilotSettings;
  if (found) cached = found;
  else cached = emptySettings();
    } catch {
      // Fallback to empty settings; caller should validate and surface helpful error.
  cached = emptySettings();
    } finally {
      inflight = null;
    }
    return cached;
  })();
  return inflight;
}

function emptySettings(): ConnectionSettings {
  // Intentionally leave optional fields empty; consumer validates and shows message.
  return { appClientId: '', tenantId: '', environmentId: '', agentIdentifier: '', directConnectUrl: '' } as ConnectionSettings;
}

// Preferred async API
export async function loadCopilotSettings(): Promise<ConnectionSettings> {
  return internalLoad();
}

// Legacy (deprecated) synchronous accessor retained for backward compatibility.
// NOTE: This returns the current cached object or an empty placeholder; it does NOT trigger re-renders when the async load completes.
// Use loadCopilotSettings() inside a React effect instead.
export function getCopilotSettings(): ConnectionSettings {
  if (!cached) {
    // Kick off async load (no await) but return placeholder immediately.
    internalLoad();
  cached = emptySettings();
  }
  return cached;
}
