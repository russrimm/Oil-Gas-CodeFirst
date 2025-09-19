declare module '@azure/msal-browser' {
  export class PublicClientApplication {
    constructor(config: Record<string, unknown>);
    initialize(): Promise<void>;
    getAllAccounts(): Array<{ username?: string; [k: string]: unknown }>;
    acquireTokenSilent(req: Record<string, unknown>): Promise<{ accessToken:string }>;
    loginPopup(req: Record<string, unknown>): Promise<{ accessToken:string }>;
  }
  export class InteractionRequiredAuthError extends Error {}
}

declare module '@microsoft/agents-copilotstudio-client' {
  export interface ConnectionSettings {
    appClientId: string;
    tenantId: string;
    environmentId?: string;
    agentIdentifier?: string;
    directConnectUrl?: string;
  }
  export type CopilotStudioWebChatConnection = object; // minimal placeholder
  export class CopilotStudioClient {
    constructor(settings: ConnectionSettings, token: string);
  }
  export const CopilotStudioWebChat: {
    createConnection: (client: CopilotStudioClient, options?: Record<string, unknown>) => CopilotStudioWebChatConnection;
  };
}