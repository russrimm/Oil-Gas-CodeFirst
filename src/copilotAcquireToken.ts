import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import type { ConnectionSettings } from '@microsoft/agents-copilotstudio-client';

export async function acquireCopilotToken(settings: ConnectionSettings) {
  const msal = new PublicClientApplication({
    auth: { clientId: settings.appClientId, authority: `https://login.microsoftonline.com/${settings.tenantId}` },
    cache: { cacheLocation: 'localStorage' }
  });
  await msal.initialize();
  const loginRequest = { scopes: ['https://api.powerplatform.com/.default'], redirectUri: window.location.origin };
  try {
    const accounts = msal.getAllAccounts();
    if (accounts.length) {
      const resp = await msal.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
      return resp.accessToken;
    }
  } catch (e) {
    if (!(e instanceof InteractionRequiredAuthError)) throw e;
  }
  const resp = await msal.loginPopup(loginRequest);
  return resp.accessToken;
}
