export interface BreaseSection {
  name: string;
  page_section_uuid: string;
  type: string;
  uuid: string;
  elements: Record<string, BreaseMedia>;
}

export interface BreaseMedia {
  alt: string;
  duration: number;
  extension: string;
  height: number;
  mimeGroup: string;
  mimeType: string;
  name: string;
  path: string;
  size: string;
  thumbnail: string;
  uuid: string;
  width: number;
  variants: BreaseMediaVariant[];
}

export interface BreaseMediaVariant {
  alt: string;
  extension: string;
  height: number;
  mimeType: string;
  path: string;
  size: string;
  type: string;
  width: number;
}

export interface BreaseNavigation {
  name: string;
  uuid: string;
  description?: string;
  items: {
    value: string;
    target?: {
      slug: string;
    };
    type: string;
    url?: string;
  }[];
}

export interface BreasePage {
  name: string | null,
  slug: string | null,
  uuid: string | null,
  parent: null,
  indexing: boolean,
  variables: string | null,
  customCode: string | null,
  openGraphUrl: string | null,
  openGraphType: string | null,
  openGraphImage: string | null,
  openGraphTitle: string | null,
  metaDescription: string | null,
  openGraphDescription: string | null,
  sections: BreaseSection[];
}

export interface BreaseSite {
  uuid: string,
  name: string,
  domain: string,
  sitemapIndexing: boolean,
}

export type BreaseResponse<T> =
  | {
      success: true;
      data: T;
      status: number;
    }
  | {
      success: false;
      error: string;
      status: number;
      endpoint?: string;
    };

export interface BreaseConfig {
  baseUrl: string;
  token: string;
  env: string;
  revalidationTime: number;
}

export interface BreaseCollectionEntry {
  slug: string;
  elements: Record<string, unknown>;
}

export interface BreaseRedirect {
  source: string;
  destination: string;
  permanent: '301' | '302' | '307' | '308';
}
