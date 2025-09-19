import { useEffect, useState, useRef } from 'react';
import { CopilotStudioClient, CopilotStudioWebChat, type CopilotStudioWebChatConnection } from '@microsoft/agents-copilotstudio-client';
import { acquireCopilotToken } from '../copilotAcquireToken';
import '../copilot-chat.css';
import { animatePanelHeight } from '../gsapHelpers';
import { gsap } from 'gsap';

// Attempt to load user-provided settings (developer copies example to real file)
// Developer copies copilotSettings.example.ts -> copilotSettings.ts
// and exports copilotSettings. We attempt a static import wrapped in try/catch for build resilience.
// Import configuration (developer must create copilotSettings.ts from example).
// We rely on a small wrapper module that always exports something.
import { loadCopilotSettings } from '../copilotSettingsLoader.js';

export function CopilotChat({ collapsed }: { collapsed?: boolean }) {
  const [connection, setConnection] = useState<CopilotStudioWebChatConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const headerHeightRef = useRef<number>(0);

  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        setLoading(true);
        const settings = await loadCopilotSettings();
        if (disposed) return;
        if (!settings.appClientId || !settings.tenantId || (!settings.directConnectUrl && (!settings.environmentId || !settings.agentIdentifier))) {
          setError('Copilot settings incomplete. Provide values in copilotSettings.js');
          return;
        }
        const token = await acquireCopilotToken(settings);
        if (disposed) return;
        const client = new CopilotStudioClient(settings, token);
        const conn = CopilotStudioWebChat.createConnection(client, { showTyping: true });
        setConnection(conn);
      } catch (e) {
        if (!disposed) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!disposed) setLoading(false);
      }
    })();
    return () => { disposed = true; };
  }, []);

  // Mount Bot Framework WebChat using the DirectLine-compatible connection returned by CopilotStudioWebChat.
  useEffect(() => {
    if (!connection) return;
    let cancelled = false;
    const container = document.getElementById('copilot-webchat-container');
    if (!container) return;

    // Clear any prior content (in case of remount/hot reload).
    container.innerHTML = '';

    (async () => {
      try {
        // Dynamic imports: core WebChat React component + React 18/19 root API.
        const [webchatModule, reactDomClient] = await Promise.all([
          import('botframework-webchat'),
          import('react-dom/client')
        ]);
        if (cancelled) return;

        interface WebChatDefaultExport {
          (props: Record<string, unknown>): unknown;
        }
        const ReactWebChat = (webchatModule as unknown as { default?: WebChatDefaultExport }).default;
        if (typeof ReactWebChat !== 'function') {
          container.innerHTML = `<div style="padding:12px;font:13px system-ui;color:#ffb4b4;line-height:1.4">` +
            `WebChat default React component not found. Check botframework-webchat version.` +
            `</div>`;
          return;
        }

        const { createRoot } = reactDomClient as unknown as { createRoot: (el: HTMLElement) => { render: (n: unknown) => void; unmount: () => void } };
        const styleOptions = {
          backgroundColor: 'transparent',
          hideUploadButton: true,
          bubbleBackground: '#132430',
          bubbleTextColor: '#e2edf3',
          bubbleFromUserBackground: '#1679c2',
          bubbleFromUserTextColor: '#ffffff',
          bubbleBorderRadius: 6,
            bubbleFromUserBorderRadius: 6,
          // Constrain bubble widths so they do not overflow the 360px panel.
          bubbleMaxWidth: 300,
          bubbleFromUserMaxWidth: 300,
          sendBoxBackground: '#132430',
          sendBoxTextColor: '#e2edf3',
          sendBoxHeight: 42,
          subtle: '#8fb3c9',
          accent: '#1679c2',
          transcriptTerminatorBackgroundColor: '#0d1821',
          transcriptTerminatorBorderColor: '#233845',
          typingAnimationHeight: 3,
          typingAnimationWidth: 36,
          hideUploadButtonWhenDisabled: true,
          spinnerAnimationHeight: 20,
          spinnerAnimationWidth: 20
        } as Record<string, unknown>;

        const root = createRoot(container);
        // Minimal random user ID (can be replaced by authenticated user principal name later)
        const userID = 'user_' + Math.random().toString(36).slice(2, 10);
        root.render(ReactWebChat({ directLine: connection as unknown as Record<string, unknown>, styleOptions, userID }));

        // Store root on container for cleanup (hot reload / unmount).
        (container as unknown as { __webchat_root__?: { unmount: () => void } }).__webchat_root__ = root;
      } catch (e) {
        if (cancelled) return;
        console.error('Failed to mount WebChat (React 19 path):', e);
        container.innerHTML = `<div style="padding:12px;font:13px system-ui;color:#ffb4b4;line-height:1.4">` +
          `<strong>WebChat mount error</strong><br/>${(e as Error).message}` +
          `</div>`;
      }
    })();

    return () => {
      cancelled = true;
      if (container) {
  const existing = (container as unknown as { __webchat_root__?: { unmount: () => void } }).__webchat_root__;
        if (existing && typeof existing.unmount === 'function') {
          try { existing.unmount(); } catch { /* ignore */ }
        }
        container.innerHTML = '';
      }
    };
  }, [connection]);

  // Animate minimize / restore transitions.
  useEffect(() => {
    if (wrapperRef.current) animatePanelHeight(wrapperRef.current, minimized);
  }, [minimized]);

  // Prevent overlap with the top header: dynamically cap max-height so the panel stops just beneath header buttons.
  useEffect(() => {
    function computeMaxHeight() {
      const header = document.querySelector('.portal-header') as HTMLElement | null;
      const hdrH = header ? header.getBoundingClientRect().height : 0;
      headerHeightRef.current = hdrH;
      const verticalGap = 12; // space to leave below header
      const bottomMargin = 8; // breathing room above bottom edge
      const available = window.innerHeight - hdrH - verticalGap - bottomMargin;
      if (wrapperRef.current) {
        const maxH = Math.max(260, available); // enforce a reasonable minimum
        wrapperRef.current.style.maxHeight = maxH + 'px';
      }
    }
    computeMaxHeight();
    const ro = (() => {
      const header = document.querySelector('.portal-header');
      if (!('ResizeObserver' in window) || !header) return null;
      const obs = new ResizeObserver(() => computeMaxHeight());
      obs.observe(header);
      return obs;
    })();
    window.addEventListener('resize', computeMaxHeight);
    window.addEventListener('orientationchange', computeMaxHeight);
    window.addEventListener('scroll', computeMaxHeight, true);
    return () => {
      window.removeEventListener('resize', computeMaxHeight);
      window.removeEventListener('orientationchange', computeMaxHeight);
      window.removeEventListener('scroll', computeMaxHeight, true);
      if (ro) ro.disconnect();
    };
  }, []);

  // Animate incoming bubbles (simple scale+fade) using MutationObserver on transcript
  useEffect(() => {
    const container = document.getElementById('copilot-webchat-container');
    if (!container) return;
    const transcript = () => container.querySelector('.webchat__basic-transcript');
    const seen = new WeakSet<Element>();
    const obs = new MutationObserver(() => {
      const root = transcript();
      if (!root) return;
      root.querySelectorAll('.webchat__stacked-layout__message').forEach(el => {
        if (seen.has(el)) return;
        seen.add(el);
        gsap.fromTo(el, { autoAlpha:0, y:8 }, { autoAlpha:1, y:0, duration:0.4, ease:'power2.out' });
      });
    });
    obs.observe(container, { subtree:true, childList:true });
    return () => obs.disconnect();
  }, [connection]);

  return (
  <div ref={wrapperRef} className={`copilot-chat-wrapper ${collapsed ? 'collapsed' : ''} ${minimized ? 'minimized' : ''}`}> 
  <div className="copilot-chat-header">Expert Oil Agent
        <button type="button" className="copilot-min-btn" aria-label={minimized ? 'Restore Copilot chat' : 'Minimize Copilot chat'} onClick={()=> setMinimized(m=>!m)}>
          {minimized ? '▢' : '–'}
        </button>
      </div>
      {loading && <div className="copilot-chat-status">Connecting…</div>}
      {error && <div className="copilot-chat-error">{error}</div>}
      <div className="copilot-chat-body">
        {/* WebChat will render into this container once the DirectLine-compatible connection is established */}
        {connection && (<div id="copilot-webchat-container" />)}
        {!connection && !loading && !error && (
          <div className="copilot-chat-initializing">Initializing Copilot…</div>
        )}
      </div>
    </div>
  );
}
