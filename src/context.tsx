import BreaseHook from './hooks';
import { ReactNode } from 'react';
import { fetchNavigation, fetchCollectionById } from './client';
import type { BreaseNavigation, BreaseCollectionEntry } from './types';

export interface BreaseContextConfig {
  navigations: Array<{ key: string; id: string }>;
  collections: Array<{ key: string; id: string }>;
}

interface BreaseContextProps {
  children: ReactNode;
  config: BreaseContextConfig;
}

export default async function BreaseContext({ children, config }: BreaseContextProps) {
  const navigationResults = await Promise.all(
    config.navigations.map(async (nav) => ({
      key: nav.key,
      result: await fetchNavigation(nav.id),
    }))
  );

  const collectionResults = await Promise.all(
    config.collections.map(async (col) => ({
      key: col.key,
      result: await fetchCollectionById(col.id),
    }))
  );

  const navigations: Record<string, BreaseNavigation> = {};
  navigationResults.forEach(({ key, result }) => {
    if (result.success) {
      navigations[key] = result.data;
    } else {
      console.error(`Failed to load navigation '${key}':`, result.error);
    }
  });

  const collections: Record<string, BreaseCollectionEntry[]> = {};
  collectionResults.forEach(({ key, result }) => {
    if (result.success) {
      collections[key] = result.data;
    } else {
      console.error(`Failed to load collection '${key}':`, result.error);
    }
  });

  const breaseData = {
    navigations,
    collections,
  };

  return <BreaseHook brease={breaseData}>{children}</BreaseHook>;
}
