"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  BreaseCollection,
  BreaseNavigation,
  BreasePage,
} from "./types.js";
import { BreasePreviewListener } from "./preview-listener.js";

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

export interface PreviewSetters {
  setPage: (page: BreasePage) => void;
}

const DataContext = createContext<BreaseContextData | undefined>(undefined);
export const PreviewSettersContext = createContext<PreviewSetters | undefined>(
  undefined,
);

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
  const [page, setPageState] = useState<BreasePage>(brease.page);
  const [alternateLinks, setAlternateLinksState] = useState<
    Record<string, string>
  >(brease.alternateLinks);

  // Track the last prop values so we can re-sync state when the server
  // provides a new page (e.g. on App Router navigation where the layout — and
  // therefore this provider — is not remounted). Without this, useState would
  // keep the initial value forever and navigation would render stale content.
  // Local state still wins between renders so preview-mode setPage keeps working.
  const [prevPageProp, setPrevPageProp] = useState<BreasePage>(brease.page);
  const [prevAlternateLinksProp, setPrevAlternateLinksProp] = useState<
    Record<string, string>
  >(brease.alternateLinks);

  if (brease.page !== prevPageProp) {
    setPrevPageProp(brease.page);
    setPageState(brease.page);
  }
  if (brease.alternateLinks !== prevAlternateLinksProp) {
    setPrevAlternateLinksProp(brease.alternateLinks);
    setAlternateLinksState(brease.alternateLinks);
  }

  const setPage = useCallback((p: BreasePage) => {
    setPageState(p);
  }, []);
  const setAlternateLinks = useCallback((links: Record<string, string>) => {
    setAlternateLinksState(links);
  }, []);

  const previewSetters = useMemo(() => ({ setPage }), [setPage]);

  return (
    <PreviewSettersContext.Provider value={previewSetters}>
      <DataContext.Provider
        value={{ ...brease, page, alternateLinks, setAlternateLinks }}
      >
        <BreasePreviewListener />
        {children}
      </DataContext.Provider>
    </PreviewSettersContext.Provider>
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
