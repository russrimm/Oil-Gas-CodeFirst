import { useContext } from 'react';
import { PowerContext } from './powerContext';

export function usePowerApp() {
  const ctx = useContext(PowerContext);
  if (!ctx) throw new Error('usePowerApp must be used within <PowerProvider>');
  return ctx;
}
