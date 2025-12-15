import type { Metadata } from 'next';
import type {
  BreaseConfig,
  BreasePage,
  BreaseCollection,
  BreaseCollectionEntry,
  BreaseNavigation,
  BreaseRedirect,
  BreaseResponse,
  BreaseSite,
} from './types.js';

/**
 * Validates and returns the Brease configuration from environment variables.
 * Throws an error if required configuration is missing.
 *
 * @throws Error if required environment variables are not set
 * @returns BreaseConfig object with validated configuration
 * @example
 * ```typescript
 * try {
 *   const config = validateBreaseConfig();
 *   console.log('Config is valid:', config);
 * } catch (error) {
 *   console.error('Configuration error:', error.message);
 * }
 * ```
 */
export function validateBreaseConfig(): BreaseConfig {
  const baseUrl = process.env.BREASE_BASE_URL;
  const token = process.env.BREASE_TOKEN;
  const env = process.env.BREASE_ENV;
  const locale = process.env.BREASE_LOCALE || 'en';
  const revalidationTime = parseInt(process.env.BREASE_REVALIDATION_TIME || '30');

  const missingVars: string[] = [];

  if (!baseUrl) missingVars.push('BREASE_BASE_URL');
  if (!token) missingVars.push('BREASE_TOKEN');
  if (!env) missingVars.push('BREASE_ENV');

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Brease configuration. Please set the following environment variables: ${missingVars.join(', ')}`
    );
  }

  return {
    baseUrl: baseUrl!,
    token: token!,
    env: env!,
    locale,
    revalidationTime,
  };
}

let cachedConfig: BreaseConfig | null = null;

/**
 * Gets the Brease configuration, validating and caching it on first use.
 * This lazy initialization ensures environment variables are read from the consuming project.
 */
function getConfig(): BreaseConfig {
  if (!cachedConfig) {
    cachedConfig = validateBreaseConfig();
  }
  return cachedConfig;
}

const getSiteUrl = (): string => {
  const config = getConfig();
  return `${config.baseUrl}`;
};

const getPageUrl = (pageSlug: string, locale?: string): string => {
  const config = getConfig();
  const effectiveLocale = locale || config.locale;
  return `${config.baseUrl}/environments/${config.env}/page?locale=${effectiveLocale}&slug=${pageSlug}`;
};

const getNavigationUrl = (navigationId: string, locale?: string): string => {
  const config = getConfig();
  const effectiveLocale = locale || config.locale;
  return `${config.baseUrl}/environments/${config.env}/navigations/${navigationId}?locale=${effectiveLocale}`;
};

const getRedirectsUrl = (): string => {
  const config = getConfig();
  return `${config.baseUrl}/environments/${config.env}/redirects`;
};

const getFetchParams = (): RequestInit => {
  const config = getConfig();
  return {
    method: 'GET',
    next: { revalidate: config.revalidationTime },
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
  };
};

interface BreaseAPIResponse {
  data: Record<string, unknown>;
  [key: string]: unknown;
}

async function handleBreaseFetch<T>(
  endpoint: string,
  parser: (json: BreaseAPIResponse) => T
): Promise<BreaseResponse<T>> {
  try {
    const response = await fetch(endpoint, getFetchParams());

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch from ${endpoint}: ${response.statusText}`,
        status: response.status,
        endpoint,
      };
    }

    const json = await response.json();
    const data = parser(json);

    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: `Request failed: ${errorMessage}`,
      status: 500,
      endpoint,
    };
  }
}

/**
 * Generates static params for Next.js static site generation.
 * Fetches all pages and returns an array of route parameters.
 *
 * @param slugKey - The key to use for the slug property (defaults to 'subpageSlug')
 * @param locale - Optional locale override (defaults to config locale)
 * @returns Array of page parameters with slug property
 * @example
 * ```typescript
 * export async function generateStaticParams() {
 *   return await generateBreasePageParams();
 * }
 * ```
 */
export async function generateBreasePageParams(
  slugKey: string = 'subpageSlug',
  locale?: string
): Promise<Record<string, string>[]> {
  const result = await fetchAllPages(locale);

  if (!result.success) {
    console.error('Failed to fetch pages for static generation:', result.error);
    return [];
  }

  return result.data
    .filter((page) => page.slug && page.slug !== '/')
    .map((page) => ({
      [slugKey]: page.slug.replace(/^\//, ''),
    }));
}

/**
 * Generates static params for collection entries in Next.js static site generation.
 * Fetches all entries from a collection and returns an array of route parameters.
 *
 * @param collectionId - The ID of the collection to fetch entries from
 * @param locale - Optional locale override (defaults to config locale)
 * @returns Array of entry parameters with slug property
 * @example
 * ```typescript
 * export async function generateStaticParams() {
 *   return await generateBreaseCollectionParams('blog-posts');
 * }
 * ```
 */
export async function generateBreaseCollectionParams(collectionId: string, locale?: string) {
  const result = await fetchCollectionById(collectionId, locale);

  if (!result.success) {
    console.error('Failed to fetch entries for static generation:', result.error);
    return [];
  }

  return result.data.entries
    .filter((entry) => entry.slug && entry.slug !== '/')
    .map((entry) => ({
      slug: entry.slug.replace(/^\//, ''),
    }));
}

/**
 * Fetches site-level information from Brease CMS.
 *
 * @returns Promise resolving to BreaseResponse containing site data
 * @example
 * ```typescript
 * const result = await fetchSite();
 * if (result.success) {
 *   console.log(result.data.name, result.data.domain);
 * }
 * ```
 */
export async function fetchSite(): Promise<BreaseResponse<BreaseSite>> {
  return handleBreaseFetch(getSiteUrl(), (json) => json.data.site as BreaseSite);
}

/**
 * Fetches a specific page by its slug from Brease CMS.
 *
 * @param pageSlug - The slug of the page to fetch
 * @param locale - Optional locale override (defaults to config locale)
 * @returns Promise resolving to BreaseResponse containing page data with sections
 * @example
 * ```typescript
 * const result = await fetchPage('about-us');
 * if (result.success) {
 *   const page = result.data;
 *   // Render page sections
 * }
 * ```
 */
export async function fetchPage(
  pageSlug: string,
  locale?: string
): Promise<BreaseResponse<BreasePage>> {
  return handleBreaseFetch(getPageUrl(pageSlug, locale), (json) => json.data.page as BreasePage);
}

/**
 * Fetches all available pages from Brease CMS.
 * Useful for static site generation.
 *
 * @param locale - Optional locale override (defaults to config locale)
 * @returns Promise resolving to BreaseResponse containing array of page slugs
 * @example
 * ```typescript
 * const result = await fetchAllPages();
 * if (result.success) {
 *   const slugs = result.data.map(page => page.slug);
 * }
 * ```
 */
export async function fetchAllPages(locale?: string): Promise<BreaseResponse<{ slug: string }[]>> {
  const config = getConfig();
  const effectiveLocale = locale || config.locale;
  const endpoint = `${config.baseUrl}/environments/${config.env}/pages?locale=${effectiveLocale}`;
  return handleBreaseFetch(endpoint, (json) => (json.data.pages as { slug: string }[]) || []);
}

/**
 * Fetches a collection by its ID, including metadata and all entries.
 *
 * @param collectionId - The ID of the collection to fetch
 * @param locale - Optional locale override (defaults to config locale)
 * @returns Promise resolving to BreaseResponse containing the complete collection with entries
 * @example
 * ```typescript
 * const result = await fetchCollectionById('blog-posts');
 * if (result.success) {
 *   const collection = result.data;
 *   console.log(collection.name, collection.status);
 *   collection.entries.forEach(entry => {
 *     // Render each entry
 *   });
 * }
 * ```
 */
export async function fetchCollectionById(
  collectionId: string,
  locale?: string
): Promise<BreaseResponse<BreaseCollection>> {
  const config = getConfig();
  const effectiveLocale = locale || config.locale;
  const endpoint = `${config.baseUrl}/environments/${config.env}/collections/${collectionId}?locale=${effectiveLocale}`;
  return handleBreaseFetch(endpoint, (json) => json.data.collection as BreaseCollection);
}

/**
 * Fetches a specific entry from a collection by its slug.
 *
 * @param collectionId - The ID of the collection
 * @param entrySlug - The slug of the entry to fetch
 * @param locale - Optional locale override (defaults to config locale)
 * @returns Promise resolving to BreaseResponse containing the collection entry
 * @example
 * ```typescript
 * const result = await fetchEntryBySlug('blog-posts', 'my-first-post');
 * if (result.success) {
 *   const entry = result.data;
 *   // Render entry
 * }
 * ```
 */
export async function fetchEntryBySlug(
  collectionId: string,
  entrySlug: string,
  locale?: string
): Promise<BreaseResponse<BreaseCollectionEntry>> {
  const config = getConfig();
  const effectiveLocale = locale || config.locale;
  const endpoint = `${config.baseUrl}/environments/${config.env}/collections/${collectionId}/entry?locale=${effectiveLocale}&slug=${entrySlug}`;
  return handleBreaseFetch(endpoint, (json) => json.data.entry as BreaseCollectionEntry);
}

/**
 * Fetches navigation data by its ID.
 *
 * @param navigationId - The ID of the navigation to fetch
 * @param locale - Optional locale override (defaults to config locale)
 * @returns Promise resolving to BreaseResponse containing navigation data
 * @example
 * ```typescript
 * const result = await fetchNavigation('header-nav');
 * if (result.success) {
 *   const nav = result.data;
 *   // Render navigation items
 * }
 * ```
 */
export async function fetchNavigation(
  navigationId: string,
  locale?: string
): Promise<BreaseResponse<BreaseNavigation>> {
  return handleBreaseFetch(
    getNavigationUrl(navigationId, locale),
    (json) => json.data.navigation as BreaseNavigation
  );
}

/**
 * Fetches all configured redirects from Brease CMS.
 *
 * @returns Promise resolving to BreaseResponse containing array of redirects
 * @example
 * ```typescript
 * const result = await fetchRedirects();
 * if (result.success) {
 *   const redirects = result.data.map(r => ({
 *     source: r.source,
 *     destination: r.destination,
 *     permanent: r.type === '301'
 *   }));
 * }
 * ```
 */
export async function fetchRedirects(): Promise<BreaseResponse<BreaseRedirect[]>> {
  return handleBreaseFetch(getRedirectsUrl(), (json) => json.data.redirects as BreaseRedirect[]);
}

/**
 * Generates Next.js metadata for a page based on Brease CMS data.
 * Includes SEO metadata, Open Graph tags, and robots directives.
 *
 * @param pageSlug - The slug of the page to generate metadata for
 * @param locale - Optional locale override (defaults to config locale)
 * @returns Promise resolving to Next.js Metadata object
 * @example
 * ```typescript
 * export async function generateMetadata({ params }: { params: { slug: string } }) {
 *   return await generateBreasePageMetadata(params.slug);
 * }
 * ```
 */
export async function generateBreasePageMetadata(
  pageSlug: string,
  locale?: string
): Promise<Metadata> {
  const result = await fetchPage(pageSlug, locale);

  if (!result.success) {
    console.error('Failed to fetch page data for metadata:', result);
    return {};
  }

  const page = result.data;

  const metadata: Metadata = {
    title: page.metaTitle || page.name || undefined,
  };

  if (page.metaDescription) {
    metadata.description = page.metaDescription;
  }

  if (!page.indexing) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  metadata.openGraph = {
    title: page.openGraphTitle || page.metaTitle || page.name || undefined,
    description: page.openGraphDescription || page.metaDescription || undefined,
    type: (page.openGraphType as 'website' | 'article') || 'website',
    url: page.openGraphUrl || undefined,
    images: page.openGraphImage
      ? [
          {
            url: page.openGraphImage,
          },
        ]
      : undefined,
  };

  return metadata;
}
