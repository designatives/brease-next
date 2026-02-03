export interface BreaseSection {
  name: string;
  page_section_uuid: string;
  type: string;
  uuid: string;
  elements: SectionElementProps;
}

export type SectionElementProps = Record<string, unknown>;

export interface BreaseMedia {
  alt: string | null;
  duration: number | null;
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
  variants: Record<string, BreaseMediaVariant>;
}

export interface BreaseMediaVariant {
  alt: string | null;
  extension: string;
  height: number;
  mimeType: string;
  path: string;
  size: string;
  type: string;
  width: number;
}

export interface BreaseNavigationItem {
  uuid: string;
  value: string;
  type: string;
  url: string | null;
  target: BreasePage | null;
  children: BreaseNavigationItem[];
}

export interface BreaseNavigation {
  name: string;
  uuid: string;
  description: string | null;
  items: BreaseNavigationItem[];
}

export interface BreasePage {
  name: string | null;
  slug: string | null;
  uuid: string | null;
  indexing: boolean;
  variables: string | null;
  customCode: string | null;
  structuredData: object[];
  openGraph: {
    url: string | null;
    type: string | null;
    image: string | null;
    title: string | null;
    description: string | null;
  };
  twitterCard: {
    site: string | null;
    type: string | null;
    image: string | null;
    title: string | null;
    creator: string | null;
    description: string | null;
  };
  canonicalUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  sections: BreaseSection[];
  additionalFields: object[] | null;
}

export interface BreaseSite {
  uuid: string;
  name: string;
  title: string | null;
  domain: string;
  published: boolean;
  status: string;
  hasMultiLocale: boolean | null;
  sitemapIndexing: boolean;
  customCode: string | null;
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
  locale: string;
  revalidationTime: number;
}

export interface BreaseCollectionEntry {
  uuid: string;
  name: string;
  slug: string;
  elements: Record<string, unknown>;
}

export interface BreaseCollection {
  uuid: string;
  name: string;
  description: string | null;
  status: string;
  entries: BreaseCollectionEntry[];
}

export interface BreaseRedirect {
  uuid: string;
  source: string;
  destination: string;
  type: '301' | '302' | '307' | '308';
}
