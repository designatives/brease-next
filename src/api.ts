import type { Metadata } from 'next';
import type {
  BreaseConfig,
  BreasePage,
  BreaseCollection,
  BreaseCollectionEntry,
  BreaseNavigation,
  BreaseRedirect,
  BreaseResponse, BreaseSite,
} from './types.js';

/**
 * Validates and returns the Brease configuration from environment variables.
 * Throws an error if required configuration is missing.
 */
function validateConfig(): BreaseConfig {
  const baseUrl = process.env.BREASE_BASE_URL;
  const token = process.env.BREASE_TOKEN;
  const env = process.env.BREASE_ENV;
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
    revalidationTime,
  };
}

// Cached config instance (lazy-loaded on first use)
let cachedConfig: BreaseConfig | null = null;

/**
 * Gets the Brease configuration, validating and caching it on first use.
 * This lazy initialization ensures environment variables are read from the consuming project.
 */
function getConfig(): BreaseConfig {
  if (!cachedConfig) {
    cachedConfig = validateConfig();
  }
  return cachedConfig;
}

const getSiteUrl = (): string => {
  const config = getConfig();
  return `${config.baseUrl}`;
};

const getPageUrl = (pageSlug: string): string => {
  const config = getConfig();
  return `${config.baseUrl}/environments/${config.env}/page?locale=en&slug=${pageSlug}`;
};

const getNavigationUrl = (navigationId: string): string => {
  const config = getConfig();
  return `${config.baseUrl}/environments/${config.env}/navigations/${navigationId}?locale=en`;
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
 * @returns Array of page parameters with subpageSlug property
 * @example
 * ```typescript
 * export async function generateStaticParams() {
 *   return await generateBreasePageParams();
 * }
 * ```
 */
export async function generateBreasePageParams() {
  const result = await fetchAllPages();

  if (!result.success) {
    console.error('Failed to fetch pages for static generation:', result.error);
    return [];
  }

  return result.data
    .filter((page) => page.slug && page.slug !== '/')
    .map((page) => ({
      subpageSlug: page.slug.replace(/^\//, ''),
    }));
}

/**
 * Generates static params for collection entries in Next.js static site generation.
 * Fetches all entries from a collection and returns an array of route parameters.
 *
 * @param collectionId - The ID of the collection to fetch entries from
 * @returns Array of entry parameters with slug property
 * @example
 * ```typescript
 * export async function generateStaticParams() {
 *   return await generateBreaseCollectionParams('blog-posts');
 * }
 * ```
 */
export async function generateBreaseCollectionParams(collectionId: string) {
  const result = await fetchCollectionById(collectionId);

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
export async function fetchPage(pageSlug: string): Promise<BreaseResponse<BreasePage>> {
  return handleBreaseFetch(getPageUrl(pageSlug), (json) => json.data.page as BreasePage);
}

/**
 * Fetches all available pages from Brease CMS.
 * Useful for static site generation.
 *
 * @returns Promise resolving to BreaseResponse containing array of page slugs
 * @example
 * ```typescript
 * const result = await fetchAllPages();
 * if (result.success) {
 *   const slugs = result.data.map(page => page.slug);
 * }
 * ```
 */
export async function fetchAllPages(): Promise<BreaseResponse<{ slug: string }[]>> {
  const config = getConfig();
  const endpoint = `${config.baseUrl}/environments/${config.env}/pages?locale=en`;
  return handleBreaseFetch(endpoint, (json) => (json.data.pages as { slug: string }[]) || []);
}

/**
 * Fetches a collection by its ID, including metadata and all entries.
 *
 * @param collectionId - The ID of the collection to fetch
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
  collectionId: string
): Promise<BreaseResponse<BreaseCollection>> {
  const config = getConfig();
  const endpoint = `${config.baseUrl}/environments/${config.env}/collections/${collectionId}?locale=en`;
  return handleBreaseFetch(endpoint, (json) => json.data.collection as BreaseCollection);
}

/**
 * Fetches a specific entry from a collection by its slug.
 *
 * @param collectionId - The ID of the collection
 * @param entrySlug - The slug of the entry to fetch
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
  entrySlug: string
): Promise<BreaseResponse<BreaseCollectionEntry>> {
  const config = getConfig();
  const endpoint = `${config.baseUrl}/environments/${config.env}/collections/${collectionId}/entry?locale=en&slug=${entrySlug}`;
  return handleBreaseFetch(endpoint, (json) => json.data.entry as BreaseCollectionEntry);
}

/**
 * Fetches navigation data by its ID.
 *
 * @param navigationId - The ID of the navigation to fetch
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
  navigationId: string
): Promise<BreaseResponse<BreaseNavigation>> {
  return handleBreaseFetch(getNavigationUrl(navigationId), (json) => json.data.navigation as BreaseNavigation);
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
 *     permanent: r.permanent === '301'
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
 * @returns Promise resolving to Next.js Metadata object
 * @example
 * ```typescript
 * export async function generateMetadata({ params }: { params: { slug: string } }) {
 *   return await generateBreasePageMetadata(params.slug);
 * }
 * ```
 */
export async function generateBreasePageMetadata(pageSlug: string): Promise<Metadata> {
  const result = await fetchPage(pageSlug);

  if (!result.success) {
    console.error('Failed to fetch page data for metadata:', result);
    return {};
  }

  const page = result.data;

  const metadata: Metadata = {
    title: page.name || undefined,
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
    title: page.openGraphTitle || page.name || undefined,
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
