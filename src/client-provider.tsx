"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import type {
  BreaseCollection,
  BreaseNavigation,
  BreasePage,
} from "./types.js";

export interface BreaseContextData {
  navigations: Record<string, BreaseNavigation>;
  collections?: Record<string, BreaseCollection>;
  availableLocales: string[];
  locale: string;
  userParams: any;
  pageSlug: string;
  page: BreasePage;
  alternateLinks: Record<string, string>;
  references: object[];
  setAlternateLinks: (links: Record<string, string>) => void;
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
  brease: Omit<BreaseContextData, "setAlternateLinks">;
}) {
  const [alternateLinks, setAlternateLinksState] = useState<
    Record<string, string>
  >(brease.alternateLinks);
  const setAlternateLinks = useCallback((links: Record<string, string>) => {
    setAlternateLinksState(links);
  }, []);

  return (
    <DataContext.Provider
      value={{ ...brease, alternateLinks, setAlternateLinks }}
    >
      {children}
    </DataContext.Provider>
  );
}

/**
 * Hook to access Brease data in client components.
 * Must be used within a BreaseContext.
 */
export function useBreaseContext(): BreaseContextData {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useBreaseContext must be used within a BreaseContext");
  }
  return context;
}
