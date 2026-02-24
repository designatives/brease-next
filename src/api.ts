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

/**
 * Validates and returns the Brease configuration from environment variables.
 * Throws an error if required configuration is missing.
 */
export function validateBreaseConfig(): BreaseConfig {
  const baseUrl = process.env.BREASE_BASE_URL;
  const token = process.env.BREASE_TOKEN;
  const env = process.env.BREASE_ENV;
  const defaultLocale = process.env.BREASE_DEFAULT_LOCALE;

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

const getPageUrl = (pageSlug: string, locale?: string): string => {
  const config = getConfig();
  return `${config.baseUrl}/environments/${config.env}/page?locale=${locale || config.defaultLocale}&slug=${ensureLeadingSlash(pageSlug)}`;
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

const getFetchParams = (options?: { tags?: string[] }): RequestInit => {
  const config = getConfig();
  const isLocalLikeEnv = ["develop", "preview", "local"].includes(
    (config.env || "").toLowerCase(),
  );

  return {
    method: "GET",
    ...(isLocalLikeEnv
      ? { cache: "no-store" as const }
      : {
          next: {
            ...(options?.tags?.length ? { tags: options.tags } : {}),
          },
        }),
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
  options?: { tags?: string[] },
): Promise<BreaseResponse<T>> {
  try {
    const response = await fetch(endpoint, getFetchParams(options));

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
      allParams.push({ locale: locale.code, slug: slugSegments });
    }
  }
  return allParams;
}

/**
 * Fetches site-level information from Brease CMS.
 */
export async function fetchSite(): Promise<BreaseResponse<BreaseSite>> {
  return handleBreaseFetch(
    getSiteUrl(),
    (json) => json.data.site as BreaseSite,
    { tags: ["brease-site"] },
  );
}

function isLocaleCode(segment: string): boolean {
  const config = getConfig();
  if (segment === config.defaultLocale) {
    return true;
  }
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

/**
 * Fetches a specific page by its slug from Brease CMS.
 *
 * @param pageSlug - The slug of the page to fetch
 * @returns Promise resolving to BreaseResponse containing page data with sections, metadata and additionalFields
 */
export async function fetchPage(
  pageSlug: string,
): Promise<BreaseResponse<BreasePage>> {
  const { slug, locale } = parseSlugAndLocale(pageSlug);
  return handleBreaseFetch(
    getPageUrl(slug, locale),
    (json) => json.data.page as BreasePage,
    { tags: ["brease-page", `brease-page-${slug || "/"}`] },
  );
}

/**
 * Fetches alternate links for a specific page by its slug from Brease CMS.
 * Useful for navigation language selectors when alternate links are not
 * available from the page response.
 *
 * @param pageSlug - The slug of the page to fetch alternate links for
 * @returns Promise resolving to BreaseResponse containing alternate link mapping
 */
export async function fetchAlternateLinks(
  pageSlug: string,
): Promise<BreaseResponse<Record<string, string>>> {
  const { slug } = parseSlugAndLocale(pageSlug);
  return handleBreaseFetch(
    getAlternateLinksUrl(slug),
    (json) => json.data.alternateLinks as Record<string, string>,
    { tags: ["brease-alternates", `brease-alternates-${slug || "/"}`] },
  );
}

/**
 * Fetches all available pages from Brease CMS.
 * Useful for static site generation.
 *
 * @param locale - Locale code for the pages to fetch
 * @returns Promise resolving to BreaseResponse containing array of page slugs
 */
export async function fetchAllPages(
  locale: string,
): Promise<BreaseResponse<{ slug: string }[]>> {
  const config = getConfig();
  const endpoint = `${config.baseUrl}/environments/${config.env}/pages?locale=${locale}`;
  return handleBreaseFetch(
    endpoint,
    (json) => (json.data.pages as { slug: string }[]) || [],
    { tags: ["brease-pages"] },
  );
}

/**
 * Fetches a collection by its ID, including metadata and all entries.
 *
 * @param collectionId - The ID of the collection to fetch
 * @param locale - Locale code for the collection data
 * @returns Promise resolving to BreaseResponse containing the complete collection with entries
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
    { tags: ["brease-collection", `brease-collection-${collectionId}`] },
  );
}

/**
 * Fetches a specific entry from a collection by its ID.
 *
 * @param collectionId - The ID of the collection
 * @param entryId - The ID of the entry to fetch
 * @param locale - Locale code for the entry data
 * @returns Promise resolving to BreaseResponse containing the collection entry
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
    { tags: ["brease-entry", `brease-entry-${entryId}`] },
  );
}

/**
 * Fetches navigation data by its ID.
 *
 * @param navigationId - The ID of the navigation to fetch
 * @param locale - Locale code for the navigation data
 * @returns Promise resolving to BreaseResponse containing navigation data
 */
export async function fetchNavigation(
  navigationId: string,
  locale: string,
): Promise<BreaseResponse<BreaseNavigation>> {
  return handleBreaseFetch(
    getNavigationUrl(navigationId, locale),
    (json) => json.data.navigation as BreaseNavigation,
    { tags: ["brease-nav", `brease-nav-${navigationId}`] },
  );
}

/**
 * Fetches all configured redirects from Brease CMS.
 *
 * @returns Promise resolving to BreaseResponse containing array of redirects
 */
export async function fetchRedirects(): Promise<
  BreaseResponse<BreaseRedirect[]>
> {
  return handleBreaseFetch(
    getRedirectsUrl(),
    (json) => json.data.redirects as BreaseRedirect[],
    { tags: ["brease-redirects"] },
  );
}

/**
 * Fetches all locales from Brease CMS.
 *
 * @returns Promise resolving to BreaseResponse containing array of locales
 */
export async function fetchLocales(): Promise<BreaseResponse<BreaseLocale[]>> {
  return handleBreaseFetch(
    getLocalesUrl(),
    (json) => json.data.locales as BreaseLocale[],
    { tags: ["brease-locales"] },
  );
}

/**
 * Generates Next.js metadata for a page based on Brease CMS data.
 * Reads all SEO fields directly from the page object — no additional fetches.
 *
 * @param page - The page to generate metadata for
 * @param options - Optional configuration (metadataBase for resolving relative OG image URLs)
 * @returns Next.js Metadata object
 */
export function generateBreasePageMetadata(
  page: BreasePage,
  options?: { metadataBase?: string | URL },
): Metadata {
  const metadata: Metadata = {};

  if (options?.metadataBase) {
    metadata.metadataBase = new URL(options.metadataBase);
  }

  metadata.title = page.metaTitle || page.name || undefined;

  if (page.metaDescription) {
    metadata.description = page.metaDescription;
  }

  if (!page.indexing) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  const alternates: Metadata["alternates"] = {};
  if (page.canonicalUrl) {
    alternates.canonical = page.canonicalUrl;
  }
  if (page.alternateLinks && Object.keys(page.alternateLinks).length > 0) {
    alternates.languages = page.alternateLinks;
  }
  if (Object.keys(alternates).length > 0) {
    metadata.alternates = alternates;
  }

  const ogTitle =
    page.openGraph?.title || page.metaTitle || page.name || undefined;
  const ogDescription =
    page.openGraph?.description || page.metaDescription || undefined;
  const ogImage = page.openGraph?.image;

  if (ogTitle || ogDescription || ogImage) {
    metadata.openGraph = {
      title: ogTitle,
      description: ogDescription,
      type: (page.openGraph?.type as "website" | "article") || "website",
      url: page.openGraph?.url || undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    };
  }

  const twitterTitle =
    page.twitterCard?.title || page.metaTitle || page.name || undefined;
  const twitterDescription =
    page.twitterCard?.description || page.metaDescription || undefined;
  const twitterImage = page.twitterCard?.image || ogImage;

  if (twitterTitle || twitterDescription || twitterImage) {
    metadata.twitter = {
      card:
        (page.twitterCard?.type as
          | "summary"
          | "summary_large_image"
          | "player"
          | "app") || "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
      creator: page.twitterCard?.creator || undefined,
      site: page.twitterCard?.site || undefined,
      images: twitterImage ? [{ url: twitterImage }] : undefined,
    };
  }

  return metadata;
}

/**
 * Generates a robots.txt configuration for Next.js.
 *
 * @param siteUrl - The canonical site URL (e.g., "https://example.com")
 * @returns MetadataRoute.Robots object for use in app/robots.ts
 */
export function generateBreaseRobots(siteUrl: string): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

/**
 * Generates sitemap from Brease CMS pages for Next.js.
 *
 * @returns Promise resolving to BreaseResponse containing sitemap data
 */
export async function generateSitemap(): Promise<
  BreaseResponse<MetadataRoute.Sitemap>
> {
  return handleBreaseFetch(
    getSitemapUrl(),
    (json) => json.data.urlset as MetadataRoute.Sitemap,
    { tags: ["brease-sitemap"] },
  );
}
