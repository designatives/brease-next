import { ReactNode } from "react";
import { BreaseClientProvider } from "./client-provider.js";
import {
  fetchNavigation,
  fetchCollectionById,
  fetchLocales,
  fetchPage,
  parseSlugAndLocale,
} from "./api.js";
import type {
  BreaseNavigation,
  BreaseCollection,
  BreasePage,
  BreaseResponse,
} from "./types.js";

export interface BreaseContextConfig {
  navigations: Array<{ key: string; id: string }>;
  collections?: Array<{ key: string; id: string }>;
  userParams: any;
}

/** Cached page fetcher; use React cache(fetchPage) so layout, metadata and page share one request. */
export type BreaseGetPage = (
  slug: string,
) => Promise<BreaseResponse<BreasePage>>;

interface BreaseContextProps {
  children: ReactNode;
  config: BreaseContextConfig;
  /**
   * Page slug for the current route.
   * May include an optional locale prefix (e.g. "en/about-us").
   * Locale will be derived from this slug using the same logic as the page API.
   */
  slug: string;
  /**
   * Optional cached page fetcher (e.g. cache(fetchPage)).
   * When provided, the context uses it instead of fetchPage so the same cache
   * can be used in generateMetadata and the page component for a single request per slug.
   */
  getPage?: BreaseGetPage;
}

/**
 * Server Component that fetches Brease data and provides it to client components.
 * Navigations must be provided, collections are optional.
 * Fetches available locales to use in navigation language selection.
 * Optionally userParams can be definied so the wrapper can be used as a normal context provider.
 * Can be used directly in server components like layout.tsx.
 *
 * @example
 * ```tsx
 * // app/[[...slug]]/layout.tsx (Server Component)
 * export default async function SlugLayout({ children, params }) {
 *   const { slug } = await params;
 *   const slugStr = (slug ?? []).join('/');
 *   return (
 *     <BreaseContext
 *       config={{
 *         navigations: [{ key: 'header', id: 'nav-id' }],
 *         collections: [{ key: 'posts', id: 'collection-id' }]
 *         userParams: { theme: 'dark' }
 *       }}
 *       slug={slugStr}
 *     >
 *       {children}
 *     </BreaseContext>
 *   );
 * }
 * ```
 */
export default async function BreaseContext({
  children,
  config,
  slug,
  getPage,
}: BreaseContextProps) {
  const { locale } = parseSlugAndLocale(slug);
  const localesResult = await fetchLocales();
  const availableLocales = [] as string[];
  if (localesResult.success) {
    localesResult.data.forEach((locale) => {
      availableLocales.push(locale.code);
    });
  } else {
    console.error(`Failed to load locales.`);
  }

  const navigationResults = await Promise.all(
    config.navigations.map(async (nav) => ({
      key: nav.key,
      result: await fetchNavigation(nav.id, locale),
    })),
  );

  const navigations: Record<string, BreaseNavigation> = {};
  navigationResults.forEach(({ key, result }) => {
    if (result.success) {
      navigations[key] = result.data;
    } else {
      console.error(`Failed to load navigation '${key}':`, result.error);
    }
  });

  const fetchPageForContext = getPage ?? fetchPage;
  const pageResult = await fetchPageForContext(slug);
  let page = {} as BreasePage;
  let alternateLinks: Record<string, string> = {};
  let references: object[] = [];
  let parentSlug: string = "";
  if (pageResult.success) {
    page = pageResult.data;
    if (page.alternateLinks) alternateLinks = page.alternateLinks;
    if (page.references) references = page.references;
    if (page.parentPageSlug) parentSlug = page.parentPageSlug;
  } else {
    console.error(`Failed to load page for slug '${slug}':`, pageResult.error);
  }

  if (config.collections) {
    const collectionResults = await Promise.all(
      config.collections.map(async (col) => ({
        key: col.key,
        result: await fetchCollectionById(col.id, locale),
      })),
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
      availableLocales,
      collections,
      locale,
      userParams: config.userParams,
      pageSlug: slug,
      page,
      parentSlug,
      alternateLinks,
      references,
    };

    return (
      <BreaseClientProvider brease={breaseData}>
        {children}
      </BreaseClientProvider>
    );
  } else {
    const breaseData = {
      navigations,
      availableLocales,
      collections: undefined,
      locale,
      userParams: config.userParams,
      pageSlug: slug,
      page,
      parentSlug,
      alternateLinks,
      references,
    };

    return (
      <BreaseClientProvider brease={breaseData}>
        {children}
      </BreaseClientProvider>
    );
  }
}
