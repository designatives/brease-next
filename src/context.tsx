import { ReactNode } from 'react';
import { BreaseClientProvider } from './client-provider.js';
import { fetchNavigation, fetchCollectionById } from './api.js';
import type { BreaseNavigation, BreaseCollection } from './types.js';

export interface BreaseContextConfig {
  navigations: Array<{ key: string; id: string }>;
  collections?: Array<{ key: string; id: string }>;
  userParams?: any;
}

interface BreaseContextProps {
  children: ReactNode;
  config: BreaseContextConfig;
  locale: string;
}

/**
 * Server Component that fetches Brease data and provides it to client components.
 * Navigations must be provided, collections are optional.
 * Optionally userParams can be definied so the wrapper can be used as a normal context provider.
 * Can be used directly in server components like layout.tsx.
 *
 * @example
 * ```tsx
 * // app/[locale]/layout.tsx (Server Component)
 * export default async function LocaleLayout({ children, params }) {
 *   const { locale } = await params;
 *   return (
 *     <BreaseContext
 *       config={{
 *         navigations: [{ key: 'header', id: 'nav-id' }],
 *         collections: [{ key: 'posts', id: 'collection-id' }]
 *         userParams: { theme: 'dark' }
 *       }}
 *       locale={locale}
 *     >
 *       {children}
 *     </BreaseContext>
 *   );
 * }
 * ```
 */
export default async function BreaseContext({ children, config, locale }: BreaseContextProps) {
  const navigationResults = await Promise.all(
    config.navigations.map(async (nav) => ({
      key: nav.key,
      result: await fetchNavigation(nav.id, locale),
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

  if (config.collections) {
    const collectionResults = await Promise.all(
      config.collections.map(async (col) => ({
        key: col.key,
        result: await fetchCollectionById(col.id, locale),
      }))
    );

    const collections: Record<string, BreaseCollection> = {};
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
      locale,
      ...config.userParams,
    };

    return <BreaseClientProvider brease={breaseData}>{children}</BreaseClientProvider>;
  } else {
    const breaseData = {
      navigations,
      locale,
      ...config.userParams,
    };

    return <BreaseClientProvider brease={breaseData}>{children}</BreaseClientProvider>;
  }
}
