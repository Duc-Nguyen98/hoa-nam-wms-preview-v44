import { createContext } from 'react';
import type { ReactNode } from 'react';

export interface ShellAction { key: string; screenKey?: string }
export type ShellActionReporter = (action: ShellAction) => void;

/** Diagnostics only. S00 owns its visible feedback; feature callbacks stay separate. */
export const ShellActionContext = createContext<ShellActionReporter | null>(null);

export function ShellActionProvider({ onAction, children }: { onAction: ShellActionReporter; children: ReactNode }) {
  return <ShellActionContext.Provider value={onAction}>{children}</ShellActionContext.Provider>;
}
