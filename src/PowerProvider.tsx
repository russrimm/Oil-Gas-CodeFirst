import { initialize } from "@microsoft/power-apps/app";
import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from 'react';
import './power-init.css';
import { PowerContext, type PowerContextValue } from './powerContext';

interface PowerProviderProps { children: ReactNode }

// Context defined in powerContext.ts; hook lives in usePowerApp.ts for fast refresh friendliness.

export default function PowerProvider({ children }: PowerProviderProps) {
    const [initializing, setInitializing] = useState(true);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [attempt, setAttempt] = useState(0);

    const init = useCallback(async () => {
        setInitializing(true);
        setError(null);
        try {
            await initialize();
            setReady(true);
            console.log('Power Platform SDK initialized successfully');
        } catch (e: unknown) {
            console.error('Failed to initialize Power Platform SDK:', e);
            setError(e instanceof Error ? e : new Error((e as object)?.toString?.() || 'Unknown error'));
            setReady(false);
        } finally {
            setInitializing(false);
        }
    }, []);

    useEffect(() => { init(); }, [attempt, init]);

    const retry = useCallback(() => {
        if (initializing) return; // avoid overlapping
        setAttempt(a => a + 1);
    }, [initializing]);

    const value: PowerContextValue = { ready, initializing, error, retry };

    return (
        <PowerContext.Provider value={value}>
            {initializing && !ready && !error && (
                <div className="pp-init-overlay">
                    <div className="pp-init-card">
                        <strong>Initializing Power Platform…</strong>
                        <div className="pp-init-sub">Loading SDK context.</div>
                    </div>
                </div>
            )}
            {error && !initializing && !ready && (
                <div className="pp-init-overlay error">
                    <div className="pp-init-card error">
                        <strong>Power Platform initialization failed.</strong>
                        <div className="pp-init-error-msg">{error.message}</div>
                        <button onClick={retry} className="pp-retry-btn">Retry</button>
                    </div>
                </div>
            )}
            {children}
        </PowerContext.Provider>
    );
}

// Hook moved to separate file (usePowerApp.ts) to satisfy fast refresh constraints.