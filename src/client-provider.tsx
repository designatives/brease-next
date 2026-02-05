'use client';

import React, { createContext, ReactNode, useContext } from 'react';
import type { BreaseCollection, BreaseNavigation } from './types.js';

export interface BreaseContextData {
  navigations: Record<string, BreaseNavigation>;
  collections: Record<string, BreaseCollection>;
  locale: string;
}

const DataContext = createContext<BreaseContextData | undefined>(undefined);

/**
 * Client-side provider component that wraps children with Brease context.
 * This is used internally by BreaseContext and should not be used directly.
 * Use BreaseContext instead in your server components.
 */
export function BreaseClientProvider({
  children,
  brease,
}: {
  children: ReactNode;
  brease: BreaseContextData;
}) {
  return <DataContext.Provider value={brease}>{children}</DataContext.Provider>;
}

/**
 * Hook to access Brease data in client components.
 * Must be used within a BreaseContext.
 */
export function useBreaseContext(): BreaseContextData {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useBreaseContext must be used within a BreaseContext');
  }
  return context;
}
