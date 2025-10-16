import type { Metadata } from 'next';
import type {
  BreaseConfig,
  BreasePage,
  BreaseCollectionEntry,
  BreaseNavigation,
  BreaseRedirect,
  BreaseResponse, BreaseSite,
} from './types';

const config: BreaseConfig = {
  baseUrl: process.env.BREASE_BASE_URL || '',
  token: process.env.BREASE_TOKEN || '',
  env: process.env.BREASE_ENV || '',
  revalidationTime: parseInt(process.env.BREASE_REVALIDATION_TIME || '30'),
};

const getSiteUrl = (): string => {
  return `${config.baseUrl}`;
};

const getPageUrl = (pageSlug: string): string => {
  return `${config.baseUrl}/environments/${config.env}/page?locale=en&slug=${pageSlug}`;
};

const getNavigationUrl = (navigationId: string): string => {
  return `${config.baseUrl}/environments/${config.env}/navigations/${navigationId}?locale=en`;
};

const getRedirectsUrl = (): string => {
  return `${config.baseUrl}/environments/${config.env}/redirects`;
};

const getFetchParams = (): RequestInit => {
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

export async function generateBreaseCollectionParams(collectionId: string) {
  const result = await fetchCollectionById(collectionId);

  if (!result.success) {
    console.error('Failed to fetch entries for static generation:', result.error);
    return [];
  }

  return result.data
    .filter((entry) => entry.slug && entry.slug !== '/')
    .map((entry) => ({
      slug: entry.slug.replace(/^\//, ''),
    }));
}

export async function fetchSite(): Promise<BreaseResponse<BreaseSite>> {
  return handleBreaseFetch(getSiteUrl(), (json) => json.data.site as BreaseSite);
}

export async function fetchPage(pageSlug: string): Promise<BreaseResponse<BreasePage>> {
  return handleBreaseFetch(getPageUrl(pageSlug), (json) => json.data.page as BreasePage);
}

export async function fetchAllPages(): Promise<BreaseResponse<{ slug: string }[]>> {
  const endpoint = `${config.baseUrl}/environments/${config.env}/pages?locale=en`;
  return handleBreaseFetch(endpoint, (json) => (json.data.pages as { slug: string }[]) || []);
}

export async function fetchCollectionById(
  collectionId: string
): Promise<BreaseResponse<BreaseCollectionEntry[]>> {
  const endpoint = `${config.baseUrl}/environments/${config.env}/collections/${collectionId}?locale=en`;
  return handleBreaseFetch(endpoint, (json) => {
    const collection = json.data.collection as { entries?: BreaseCollectionEntry[] };
    return collection.entries || [];
  });
}

export async function fetchEntryBySlug(
  collectionId: string,
  entrySlug: string
): Promise<BreaseResponse<BreaseCollectionEntry>> {
  const endpoint = `${config.baseUrl}/environments/${config.env}/collections/${collectionId}/entry?locale=en&slug=${entrySlug}`;
  return handleBreaseFetch(endpoint, (json) => json.data.entry as BreaseCollectionEntry);
}

export async function fetchNavigation(
  navigationId: string
): Promise<BreaseResponse<BreaseNavigation>> {
  return handleBreaseFetch(getNavigationUrl(navigationId), (json) => json.data.navigation as BreaseNavigation);
}

export async function fetchRedirects(): Promise<BreaseResponse<BreaseRedirect[]>> {
  return handleBreaseFetch(getRedirectsUrl(), (json) => json.data.redirects as BreaseRedirect[]);
}

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
