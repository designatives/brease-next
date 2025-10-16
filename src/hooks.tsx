'use client';

import React, { createContext, ReactNode } from 'react';
import type {BreaseCollectionEntry, BreaseNavigation} from './types';

interface BreaseContextData {
  navigations: Record<string, BreaseNavigation>;
  collections: Record<string, BreaseCollectionEntry[]>;
}

const DataContext = createContext<BreaseContextData>({
  navigations: {},
  collections: {},
});

export const BreaseHook = ({
  children,
  brease,
}: {
  children: ReactNode;
  brease: BreaseContextData;
}) => {
  return <DataContext.Provider value={brease}>{children}</DataContext.Provider>;
};

export const useBrease = () => {
  const context = React.useContext(DataContext);
  if (context === undefined) {
    throw new Error('useBrease must be used within a BreaseContext');
  }
  return context;
};

export default BreaseHook;
