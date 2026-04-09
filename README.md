# brease-next

[![npm version](https://img.shields.io/npm/v/brease-next.svg)](https://www.npmjs.com/package/brease-next)
[![npm downloads](https://img.shields.io/npm/dm/brease-next.svg)](https://www.npmjs.com/package/brease-next)
[![license](https://img.shields.io/npm/l/brease-next.svg)](https://github.com/designatives/brease-next/blob/main/LICENSE)
[![CI](https://github.com/designatives/brease-next/actions/workflows/ci.yml/badge.svg)](https://github.com/designatives/brease-next/actions/workflows/ci.yml)

Official Next.js integration for Brease CMS — React components, hooks, and utilities for seamless headless CMS content management with SSG and good SEO.

## Installation

```bash
npm install brease-next
```

## Requirements

- Node.js >= 16.0.0
- Next.js >= 13.0.0
- React >= 18.0.0

## Configuration

Set up the following environment variables in your `.env.local` file:

```env
BREASE_BASE_URL=https://your-brease-api.com
BREASE_TOKEN=your_api_token
BREASE_ENV=your_environment_id
BREASE_DEFAULT_LOCALE=en          # Default locale code (e.g. 'en')
BREASE_CACHE_MODE=isr             # Required: "isr" or "no-store"
BREASE_REVALIDATION_TIME=30       # Seconds until pages regenerate (only used when BREASE_CACHE_MODE=isr)
```

`BREASE_CACHE_MODE` controls how Next.js fetches are cached:

- `"isr"` → ISR-style revalidation via `next: { revalidate }`, pages regenerate after `BREASE_REVALIDATION_TIME` seconds
- `"no-store"` → `cache: 'no-store'`, always fetch fresh (suitable for development or preview environments)

## Styles

If you use components that rely on package styles (e.g. the section toolbar in preview), import the CSS once in your app (typically in `app/layout.tsx`):

```ts
import "brease-next/styles";
```

## Recommended App Router Architecture

Brease context is driven by the **page slug**: you put `BreaseContext` in a **slug layout** so it can fetch the page (and derive locale from the slug). The context stores only **alternateLinks**, **references**, navigations, optional collections, and userParams (not the full page). Client components (Header, language selector, etc.) use `useBrease()` to read them. The slug page fetches the full page for metadata and content rendering.

### Project structure

```txt
app/
  layout.tsx                # Root: <html>, <body>, styles, {children}
  [[...slug]]/
    layout.tsx              # Slug layout: BreaseContext(config, slug), Header, Footer
    page.tsx                # Slug page: generateMetadata, BreasePage, structured data
  sitemap.ts
  robots.ts
lib/
  brease/
    component-map.ts        # Section mapping + BreaseContextConfig
    get-page.ts            # Optional: cache(fetchPage) for deduplication
components/
  layout/
    Header.tsx              # useBrease() for navigations, alternateLinks, locale
    Footer.tsx
  section/
    HeroSection.tsx
    ContentSection.tsx
    ...
```

### Root layout (`app/layout.tsx`)

Only structure and global styles. No Brease logic here.

```tsx
import "brease-next/styles";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Cached getPage (`lib/brease/get-page.ts`)

Export a single cached page fetcher and pass it to both the slug layout and the page. That way the **context**, **generateMetadata**, and **page** component share one request per slug (no duplicate fetch).

```tsx
import { cache } from "react";
import { fetchPage } from "brease-next";

export const getPage = cache(async (slug: string) => fetchPage(slug));
```

### Slug layout (`app/[[...slug]]/layout.tsx`)

`BreaseContext` receives **config**, **slug**, and optionally **getPage**. It fetches navigations, collections, and locales; uses `getPage(slug)` (or `fetchPage(slug)`) to get alternate links and references for the current page; derives **locale** from the slug; and puts **alternateLinks**, **references**, navigations, collections, and userParams into context (not the full page).

```tsx
import { BreaseContext } from "brease-next";
import { contextData } from "@/lib/brease/component-map";
import { getPage } from "@/lib/brease/get-page";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const slugStr = (slug ?? []).join("/");

  return (
    <BreaseContext config={contextData} slug={slugStr} getPage={getPage}>
      <Header />
      <main>{children}</main>
      <Footer />
    </BreaseContext>
  );
}
```

### Slug page (`app/[[...slug]]/page.tsx`)

Use the same **getPage** from the shared module for **generateMetadata** and the page component. With **getPage** also passed to the context, layout, metadata and page all share one cached request per slug.

```tsx
import {
  generateBreasePageParams,
  generateBreasePageMetadata,
  BreasePage,
  BreaseStructuredData,
  BreaseCustomCode,
  BreaseFetchError,
} from "brease-next";
import { componentMap } from "@/lib/brease/component-map";
import { getPage } from "@/lib/brease/get-page";
import { notFound } from "next/navigation";

export const dynamicParams = true;

export async function generateStaticParams() {
  const params = await generateBreasePageParams();
  return params.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const slugStr = (slug ?? []).join("/");
  const result = await getPage(slugStr);
  if (!result.success) return {};
  return generateBreasePageMetadata(result.data, {
    metadataBase: "https://example.com",
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const slugStr = (slug ?? []).join("/");
  const result = await getPage(slugStr);

  if (!result.success) {
    if (result.status === 404) notFound();
    throw new BreaseFetchError(result.error, result.status, result.endpoint);
  }

  return (
    <>
      <BreaseStructuredData page={result.data} />
      <BreaseCustomCode page={result.data} />
      <BreasePage page={result.data} sectionMap={componentMap} />
    </>
  );
}
```

### Component map (`lib/brease/component-map.ts`)

Maps section `type` values from CMS to React components. Also configures which navigations/collections to load.

**Important:** Every component you pass in `componentMap` to `<BreasePage>` must be explicitly marked as a Client Component with `'use client'` at the top of its file. This is required so they can be used correctly with the page renderer.

```tsx
import type { BreaseContextConfig } from "brease-next";
import { HeroSection } from "@/components/section/HeroSection";
import { ContentSection } from "@/components/section/ContentSection";

export const componentMap: Record<string, React.ComponentType<any>> = {
  hero: HeroSection,
  content: ContentSection,
};

export const contextData: BreaseContextConfig = {
  navigations: [{ key: "mainNavigation", id: "nav-xxxxx" }],
  collections: [],
  userParams: {},
};
```

### Header with navigation + language selector (`components/layout/Header.tsx`)

Uses `useBrease()` to read navigations, `alternateLinks`, `references`, and `locale` from context (provided by the slug layout).

```tsx
"use client";

import { useBrease, BreaseLink } from "brease-next";

export function Header() {
  const { navigations, alternateLinks, availableLocales, locale } = useBrease();
  const nav = navigations.mainNavigation;

  return (
    <header>
      <nav>
        <ul>
          {nav?.items.map((item) => (
            <li key={item.uuid}>
              <BreaseLink linkData={item}>{item.label}</BreaseLink>
              {item.children?.length ? (
                <ul>
                  {item.children.map((child) => (
                    <li key={child.uuid}>
                      <BreaseLink linkData={child}>{child.label}</BreaseLink>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>
      <div className="language-selector">
        {availableLocales.map((loc) => (
          <a
            key={loc}
            href={alternateLinks[loc] || `/${loc}`}
            aria-current={loc === locale ? "page" : undefined}
          >
            {loc.toUpperCase()}
          </a>
        ))}
      </div>
    </header>
  );
}
```

### Sitemap (`app/sitemap.ts`)

```tsx
import { generateSitemap } from "brease-next";

export default async function sitemap() {
  const result = await generateSitemap();
  if (result.success) return result.data;
  return [];
}
```

### Robots (`app/robots.ts`)

```tsx
import { generateBreaseRobots } from "brease-next";

export default function robots() {
  return generateBreaseRobots("https://example.com");
}
```

You can customize robots with `GenerateBreaseRobotsOptions`:

```tsx
import {
  generateBreaseRobots,
  type GenerateBreaseRobotsOptions,
} from "brease-next";

export default function robots() {
  const options: GenerateBreaseRobotsOptions = {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/"] },
  };
  return generateBreaseRobots("https://example.com", options);
}
```

## Core Concepts & APIs

### Configuration: `validateBreaseConfig()`

Validates and returns the Brease configuration from environment variables.

```ts
import { validateBreaseConfig } from "brease-next";

try {
  const config = validateBreaseConfig();
  console.log("Config is valid:", config);
} catch (error) {
  console.error("Configuration error:", (error as Error).message);
}
```

### Fetch functions

All fetch functions return a `BreaseResponse<T>`:

```ts
type BreaseResponse<T> =
  | { success: true; data: T; status: number }
  | { success: false; error: string; status: number; endpoint?: string };
```

- **`fetchSite()`** – Site-level information.
- **`fetchPage(pageSlug: string)`** – Full page with sections and meta.
- **`fetchAllPages(locale: string)`** – All pages for a locale (used by `generateBreasePageParams`).
- **`fetchCollectionById(collectionId: string, locale: string)`** – A collection with its entries.
- **`fetchEntryById(collectionId: string, entryId: string, locale: string)`** – Single entry from a collection.
- **`fetchNavigation(navigationId: string, locale: string)`** – Navigation tree by ID.
- **`fetchLocales()`** – Available locales for the site.
- **`fetchRedirects()`** – Configured redirects.
- **`fetchAlternateLinks(slug: string)`** – Alternate links map for a page (kept for advanced use; page detail should already include `alternateLinks`).
- **`generateBreasePageParams()`** – Helper for `generateStaticParams`; returns `{ locale, slug: string[] }[]`.
- **`generateSitemap()`** – Fetches sitemap data from Brease.

### Components

- **`<BreasePage page sectionMap>`**
  - Renders your mapped section components. All components in `sectionMap` must be Client Components: add `'use client'` at the top of each section component file (e.g. `HeroSection.tsx`, `ContentSection.tsx`).
  - Automatically shows the preview toolbar when rendered inside the Brease CMS iframe.

- **`<BreaseStructuredData page>`**
  - Server component.
  - Renders `page.structuredData` as JSON-LD in `<script type="application/ld+json">`.

- **`<BreaseCustomCode page>`**
  - Server component.
  - Injects `page.customCode` as raw HTML (e.g. analytics or tracking snippets).

- **`<BreaseImage breaseImage>`**
  - Renders optimized images based on Brease media variants.

- **`<BreaseContext config slug getPage?>`**
  - Server component.
  - Accepts `config` (navigations, collections, userParams), `slug` (current page slug, optionally with locale prefix), and optional `getPage` (e.g. `cache(fetchPage)`) so the context, generateMetadata and page share one request.
  - Derives locale from the slug, fetches navigations, collections, locales, and the page (via `getPage(slug)` or `fetchPage(slug)`) to extract alternateLinks and references; provides to client components: navigations, collections, availableLocales, locale, userParams, pageSlug, alternateLinks, references (not the full page).

### Hooks

#### `useBrease()`

Client hook (must be used inside `BreaseContext`):

```ts
const {
  navigations,           // Record<string, BreaseNavigation>
  collections,           // Record<string, BreaseCollection> | undefined
  availableLocales,      // string[]
  locale,                // string
  userParams,            // any
  pageSlug,              // string
  page,                  // BreasePage — the full page object
  alternateLinks,        // Record<string, string> — locale → URL for language selector
  references,            // object[] — from the current page
  setAlternateLinks,     // (links: Record<string, string>) => void
} = useBrease();
```

### SEO helpers

- **`generateBreasePageMetadata(page, options?)`**
  - Generates a Next.js `Metadata` object from a `BreasePage`.
  - Reads:
    - `metaTitle`, `metaDescription`
    - `openGraph` (title, description, url, image, type)
    - `twitterCard`
    - `canonicalUrl`
    - `alternateLinks`
    - `indexing` (sets `robots: { index: false, follow: false }` when false)
  - `options.metadataBase` is used as `metadata.metadataBase` to resolve relative URLs.

- **`generateBreaseRobots(siteUrl, options?)`**
  - Generates `MetadataRoute.Robots` for `app/robots.ts`.
  - Defaults:
    - `rules: { userAgent: "*", allow: "/" }`
    - `sitemap: "${siteUrl}/sitemap.xml"`
  - Optionally override `rules`, `sitemap`, `host` using `GenerateBreaseRobotsOptions`.

## Error Handling

Always check `success` before using `data`:

```tsx
import { fetchPage } from "brease-next";

export default async function Page() {
  const result = await fetchPage("about");

  if (!result.success) {
    console.error("Failed to fetch page:", result.error);
    return <div>Error loading page</div>;
  }

  const page = result.data;
  // render with <BreasePage />
}
```

Common causes of errors:

- Missing env vars (`BREASE_BASE_URL`, `BREASE_TOKEN`, `BREASE_ENV`, `BREASE_DEFAULT_LOCALE`, `BREASE_CACHE_MODE`)
- Network/API outages
- 404 (page/collection not found)
- 401 (invalid token)

For stricter flows, you can wrap your own `ensureSuccess` around `BreaseResponse<T>` and throw for non-success.

## Development

### Building

```bash
npm run build
```

This generates ESM builds plus TypeScript declarations in `dist/`.

### Watch Mode

```bash
npm run dev
```

## TypeScript Support

This package ships full TypeScript types. Example:

```ts
import type {
  BreasePageType,
  BreaseSection,
  BreaseMedia,
  BreaseNavigation,
  BreaseCollection,
  BreaseResponse,
} from "brease-next";
```

## Publishing & Releases

This package uses GitHub Actions to build and publish to npm.

### Setup Requirements

1. Generate an npm token with **Automation** or **Publish** permissions at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
2. Add it as a secret named `NPM_TOKEN` in your GitHub repository settings:
   - Go to **Settings → Secrets and variables → Actions**
   - Click **New repository secret**
   - Name: `NPM_TOKEN`
   - Value: your npm token

### Creating a Release

1. Update the version in `package.json`:

   ```bash
   npm version patch  # Bug fixes (0.1.0 → 0.1.1)
   npm version minor  # New features (0.1.0 → 0.2.0)
   npm version major  # Breaking changes (0.1.0 → 1.0.0)
   ```

2. Update `CHANGELOG.md` with changes
3. Commit your changes:

   ```bash
   git add .
   git commit -m "chore: release vX.Y.Z"
   ```

4. Push with tags:

   ```bash
   git push && git push --tags
   ```

The CI workflow will:

- Run ESLint and Prettier checks
- Build the package
- Publish to npm
- Create a GitHub release

## License

ISC
