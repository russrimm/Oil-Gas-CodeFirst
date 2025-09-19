import { createContext } from 'react';

export interface PowerContextValue {
  ready: boolean;
  initializing: boolean;
  error: Error | null;
  retry: () => void;
}

export const PowerContext = createContext<PowerContextValue | undefined>(undefined);
