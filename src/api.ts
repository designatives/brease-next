import type { Metadata, MetadataRoute } from "next";
import type {
  BreaseConfig,
  BreasePage,
  BreaseCollection,
  BreaseCollectionEntry,
  BreaseNavigation,
  BreaseRedirect,
  BreaseResponse,
  BreaseSite,
  BreaseLocale,
} from "./types.js";
import {
  AlternateLinkDescriptor,
  Languages,
} from "next/dist/lib/metadata/types/alternative-urls-types.js";

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
  const defaultLocale = process.env.BREASE_DEFAULT_LOCALE;
  const revalidationTime = parseInt(
    process.env.BREASE_REVALIDATION_TIME || "30",
  );

  const missingVars: string[] = [];

  if (!baseUrl) missingVars.push("BREASE_BASE_URL");
  if (!token) missingVars.push("BREASE_TOKEN");
  if (!env) missingVars.push("BREASE_ENV");
  if (!defaultLocale) missingVars.push("BREASE_DEFAULT_LOCALE");

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Brease configuration. Please set the following environment variables: ${missingVars.join(", ")}`,
    );
  }

  return {
    baseUrl: baseUrl!,
    token: token!,
    env: env!,
    defaultLocale: defaultLocale!,
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

function ensureLeadingSlash(path: string): string {
  if (!path.startsWith("/")) {
    return "/" + path;
  }
  return path;
}

const getSiteUrl = (): string => {
  const config = getConfig();
  return `${config.baseUrl}`;
};

const getPageUrl = (
  pageSlug: string,
  locale?: string,
  metaOnly?: boolean,
): string => {
  const config = getConfig();
  return `${config.baseUrl}/environments/${config.env}/page?locale=${locale || config.defaultLocale}&slug=${ensureLeadingSlash(pageSlug)}${metaOnly ? `&metaOnly=true` : ""}`;
};

const getAlternateLinksUrl = (pageSlug: string): string => {
  const config = getConfig();
  return `${config.baseUrl}/environments/${config.env}/page/alternate?slug=${ensureLeadingSlash(pageSlug)}`;
};

const getNavigationUrl = (navigationId: string, locale: string): string => {
  const config = getConfig();
  return `${config.baseUrl}/environments/${config.env}/navigations/${navigationId}?locale=${locale}`;
};

const getRedirectsUrl = (): string => {
  const config = getConfig();
  return `${config.baseUrl}/environments/${config.env}/redirects`;
};

const getLocalesUrl = (): string => {
  const config = getConfig();
  return `${config.baseUrl}/environments/${config.env}/locales`;
};

const getSitemapUrl = (): string => {
  const config = getConfig();
  return `${config.baseUrl}/environments/${config.env}/sitemap`;
};

const getFetchParams = (): RequestInit => {
  const config = getConfig();
  return {
    method: "GET",
    next: { revalidate: config.revalidationTime },
    headers: {
      "Content-Type": "application/json",
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
  parser: (json: BreaseAPIResponse) => T,
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
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
 * @returns Array of page parameters with locale and slug (path segments array for catch-all routes)
 * @example
 * ```typescript
 * export async function generateStaticParams() {
 *   return await generateBreasePageParams();
 * }
 * ```
 */
export async function generateBreasePageParams(): Promise<
  { locale: string; slug: string[] }[]
> {
  const allParams: { locale: string; slug: string[] }[] = [];
  const localesResult = await fetchLocales();
  if (!localesResult.success) {
    console.error(
      "Failed to fetch locales for static generation:",
      localesResult.error,
    );
    return [];
  }
  for (const locale of localesResult.data) {
    const pagesResult = await fetchAllPages(locale.code);
    if (!pagesResult.success) {
      console.error(
        "Failed to fetch pages for static generation:",
        pagesResult.error,
      );
      return [];
    }
    for (const page of pagesResult.data) {
      const slugSegments = (page.slug ?? "")
        .replace(/^\/+|\/+$/g, "")
        .split("/")
        .filter(Boolean);
      // Always push a param, even for the homepage where slugSegments.length === 0.
      // This ensures that optional catch-all routes (`[[...slug]]`) receive a param
      // for the root path (`/`) when there is only a single locale.
      allParams.push({ locale: locale.code, slug: slugSegments });
    }
  }
  return allParams;
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
  return handleBreaseFetch(
    getSiteUrl(),
    (json) => json.data.site as BreaseSite,
  );
}

/**
 * Fetches a specific page by its slug from Brease CMS.
 *
 * @param pageSlug - The slug of the page to fetch
 * @param locale - Optional locale override (defaults to config locale)
 * @param metaOnly - Optional param to fetch only metadata fields
 * @returns Promise resolving to BreaseResponse containing page data with sections, metadata and additionalFields
 * @example
 * ```typescript
 * const result = await fetchPage('about-us');
 * if (result.success) {
 *   const page = result.data;
 *   // Render page sections
 * }
 * ```
 */
function isLocaleCode(segment: string): boolean {
  const config = getConfig();
  if (segment === config.defaultLocale) {
    return true;
  }
  // Basic locale patterns like "en" or "en-US"
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(segment);
}
function parseSlugAndLocale(pageSlug: string): {
  slug: string;
  locale: string;
} {
  const config = getConfig();
  const slugParts = pageSlug.split("/").filter(Boolean);
  let locale = config.defaultLocale;
  if (slugParts.length > 0 && isLocaleCode(slugParts[0])) {
    locale = slugParts.shift() as string;
  }
  const normalizedSlug = slugParts.join("/");
  return {
    slug: normalizedSlug,
    locale,
  };
}

export async function fetchPage(
  pageSlug: string,
  metaOnly?: boolean,
): Promise<BreaseResponse<BreasePage>> {
  const { slug, locale } = parseSlugAndLocale(pageSlug);
  return handleBreaseFetch(
    getPageUrl(slug, locale, metaOnly),
    (json) => json.data.page as BreasePage,
  );
}

/**
 * Fetches alternate links for a specific page by its slug from Brease CMS.
 *
 * @param pageSlug - The slug of the page to fetch
 * @param locale - Optional locale override (defaults to config locale)
 * @returns Promise resolving to BreaseResponse containing an array of alternate link objects {[localeCode: string]: string}
 * @example
 * ```typescript
 * const result = await fetchAlternateLinks('about-us');
 * if (result.success) {
 *   const alternateLinks = result.data;
 *   // Render page sections
 * }
 * ```
 */
export async function fetchAlternateLinks(
  pageSlug: string,
): Promise<
  BreaseResponse<Languages<string | URL | AlternateLinkDescriptor[] | null>>
> {
  const { slug } = parseSlugAndLocale(pageSlug);
  return handleBreaseFetch(
    getAlternateLinksUrl(slug),
    (json) =>
      json.data.alternateLinks as Languages<
        string | URL | AlternateLinkDescriptor[] | null
      >,
  );
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
export async function fetchAllPages(
  locale: string,
): Promise<BreaseResponse<{ slug: string }[]>> {
  const config = getConfig();
  const endpoint = `${config.baseUrl}/environments/${config.env}/pages?locale=${locale}`;
  return handleBreaseFetch(
    endpoint,
    (json) => (json.data.pages as { slug: string }[]) || [],
  );
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
  locale: string,
): Promise<BreaseResponse<BreaseCollection>> {
  const config = getConfig();
  const endpoint = `${config.baseUrl}/environments/${config.env}/collections/${collectionId}?locale=${locale}`;
  return handleBreaseFetch(
    endpoint,
    (json) => json.data.collection as BreaseCollection,
  );
}

/**
 * Fetches a specific entry from a collection by its ID.
 *
 * @param collectionId - The ID of the collection
 * @param entryId - The ID of the entry to fetch
 * @param locale - Optional locale override (defaults to config locale)
 * @returns Promise resolving to BreaseResponse containing the collection entry
 * @example
 * ```typescript
 * const result = await fetchEntryById('col-xxxx', 'ent-xxxx');
 * if (result.success) {
 *   const entry = result.data;
 *   // Render entry
 * }
 * ```
 */
export async function fetchEntryById(
  collectionId: string,
  entryId: string,
  locale: string,
): Promise<BreaseResponse<BreaseCollectionEntry>> {
  const config = getConfig();
  const endpoint = `${config.baseUrl}/environments/${config.env}/collections/${collectionId}/entries/${entryId}?locale=${locale}`;
  return handleBreaseFetch(
    endpoint,
    (json) => json.data.entry as BreaseCollectionEntry,
  );
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
  locale: string,
): Promise<BreaseResponse<BreaseNavigation>> {
  return handleBreaseFetch(
    getNavigationUrl(navigationId, locale),
    (json) => json.data.navigation as BreaseNavigation,
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
export async function fetchRedirects(): Promise<
  BreaseResponse<BreaseRedirect[]>
> {
  return handleBreaseFetch(
    getRedirectsUrl(),
    (json) => json.data.redirects as BreaseRedirect[],
  );
}

/**
 * Fetches all locales from Brease CMS.
 *
 * @returns Promise resolving to BreaseResponse containing array of locales
 * @example
 * ```typescript
 * export async function generateStaticParams() {
 *   const allParams: { locale: string; slug: string }[] = []
 *   const result = await fetchLocales()
 *   if(result.success){
 *     for (const locale of result.locales) {
 *       const pages = await generateBreasePageParams('slug', locale)
 *       for (const page of pages) {
 *         allParams.push({ locale, slug: page.slug })
 *       }
 *     }
 *   }
 *   return allParams
 * }
 * ```
 */
export async function fetchLocales(): Promise<BreaseResponse<BreaseLocale[]>> {
  return handleBreaseFetch(
    getLocalesUrl(),
    (json) => json.data.locales as BreaseLocale[],
  );
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
  pageResult: BreasePage,
): Promise<Metadata> {
  const page = pageResult as BreasePage;

  //const alternatesResult = await fetchAlternateLinks(pageSlug);
  //let alternates = {} as Languages<string | URL | AlternateLinkDescriptor[] | null>;

  /*if (!pageResult.success) {
    if (pageResult.status === 404)
      throw new BreaseFetchError(pageResult.error, pageResult.status, pageResult.endpoint);
  } else {
    page = pageResult.data;
  }*/

  /*if (!alternatesResult.success) {
    if (alternatesResult.status === 404)
      throw new BreaseFetchError(
        alternatesResult.error,
        alternatesResult.status,
        alternatesResult.endpoint
      );
  } else {
    alternates = alternatesResult.data;
  }*/

  const metadata: Metadata = {
    title: page.metaTitle || page.name || undefined,
  };

  if (page.metaDescription) {
    metadata.description = page.metaDescription;
  }

  if (page.canonicalUrl) {
    metadata.alternates = {
      canonical: page.canonicalUrl,
    };
  }

  if (!page.indexing) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  /*if (alternates && Object.keys(alternates).length > 0) {
    metadata.alternates = {
      ...metadata.alternates,
      languages: alternates,
    };
  }*/

  metadata.openGraph = {
    title: page?.openGraph?.title || page?.metaTitle || page?.name || undefined,
    description:
      page?.openGraph?.description || page?.metaDescription || undefined,
    type: (page?.openGraph?.type as "website" | "article") || "website",
    url: page?.openGraph?.url || undefined,
    images: page?.openGraph?.image
      ? [
          {
            url: page?.openGraph?.image,
          },
        ]
      : undefined,
  };

  metadata.twitter = {
    creator: page?.twitterCard?.creator || undefined,
    site: page?.twitterCard?.site || undefined,
    card: page?.twitterCard?.type as
      | "summary"
      | "summary_large_image"
      | "player"
      | "app",
    title:
      page?.twitterCard?.title || page?.metaTitle || page?.name || undefined,
    images: page?.openGraph?.image
      ? [
          {
            url: page?.openGraph?.image,
          },
        ]
      : undefined,
    description:
      page?.twitterCard?.description || page?.metaDescription || undefined,
  };

  return metadata;
}

/**
 * Generates sitemap from Brease CMS pages for NextJS.
 *
 * @returns Promise resolving to MetadataRoute.Sitemap
 * @example
 * ```typescript
 * export default function sitemap(): MetadataRoute.Sitemap {
 *  const result = await generateSitemap();
 *  if (result.success) return result.data
 *  return []
 * }
 * ```
 */
export async function generateSitemap(): Promise<
  BreaseResponse<MetadataRoute.Sitemap>
> {
  return handleBreaseFetch(
    getSitemapUrl(),
    (json) => json.data.urlset as MetadataRoute.Sitemap,
  );
}
