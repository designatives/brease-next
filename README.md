# brease-next

[![npm version](https://img.shields.io/npm/v/brease-next.svg)](https://www.npmjs.com/package/brease-next)
[![npm downloads](https://img.shields.io/npm/dm/brease-next.svg)](https://www.npmjs.com/package/brease-next)
[![license](https://img.shields.io/npm/l/brease-next.svg)](https://github.com/designatives/brease-next/blob/main/LICENSE)
[![CI](https://github.com/designatives/brease-next/actions/workflows/ci.yml/badge.svg)](https://github.com/designatives/brease-next/actions/workflows/ci.yml)

Official Next.js integration for Brease CMS — React components, hooks, and utilities for seamless headless CMS content management with SSG and on-demand revalidation.

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
BREASE_DEFAULT_LOCALE=en
BREASE_REVALIDATION_SECRET=your_shared_secret   # For on-demand revalidation webhook
```

## Styles

If you use components that rely on package styles (e.g. section toolbar in preview mode), import the CSS once in your root layout:

```typescript
import 'brease-next/styles';
```

## Recommended Project Structure

```
app/
  layout.tsx                # <html>, <body>, BreaseContext
  [[...slug]]/
    page.tsx                # fetchPage, generateMetadata, BreasePage
  sitemap.ts                # generateSitemap
  robots.ts                 # generateBreaseRobots
  api/
    revalidate/
      route.ts              # One-line re-export so the package handles the webhook
lib/
  brease/
    component-map.ts        # Section type → Component mapping + context config
components/
  layout/
    Header.tsx              # Navigation + language selector via useBrease()
    Footer.tsx
  section/
    HeroSection.tsx          # Individual section components
    ...
```

## Full Architecture Example

### Root Layout

`<html>` and `<body>` belong here. `BreaseContext` wraps children to provide navigation and collection data.

```tsx
// app/layout.tsx
import { BreaseContext } from 'brease-next';
import 'brease-next/styles';
import { contextData } from '@/lib/brease/component-map';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BreaseContext config={contextData} locale={process.env.BREASE_DEFAULT_LOCALE!}>
          <Header />
          <main>{children}</main>
          <Footer />
        </BreaseContext>
      </body>
    </html>
  );
}
```

### Page Component

Pages render content only — no `<head>` or `<body>`. Uses `cache()` to deduplicate the fetch between `generateMetadata` and the page render.

```tsx
// app/[[...slug]]/page.tsx
import { cache } from 'react';
import {
  fetchPage,
  generateBreasePageParams,
  generateBreasePageMetadata,
  BreasePage,
  BreaseStructuredData,
  BreaseCustomCode,
  BreasePageAlternates,
  BreaseFetchError,
} from 'brease-next';
import { componentMap } from '@/lib/brease/component-map';
import { notFound } from 'next/navigation';

export const dynamicParams = true;

const getPage = cache(async (slug: string) => fetchPage(slug));

export async function generateStaticParams() {
  return await generateBreasePageParams();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug = [] } = await params;
  const result = await getPage(slug.join('/'));
  if (!result.success) return {};
  return generateBreasePageMetadata(result.data, {
    metadataBase: 'https://example.com',
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug = [] } = await params;
  const result = await getPage(slug.join('/'));

  if (!result.success) {
    if (result.status === 404) notFound();
    throw new BreaseFetchError(result.error, result.status, result.endpoint);
  }

  return (
    <>
      <BreaseStructuredData page={result.data} />
      <BreaseCustomCode page={result.data} />
      <BreasePageAlternates links={result.data.alternateLinks} />
      <BreasePage page={result.data} sectionMap={componentMap} />
    </>
  );
}
```

### Header with Language Selector

The header reads navigation data and alternate links from the Brease context. `alternateLinks` are pushed into the context by `BreasePageAlternates` in the page component.

```tsx
// components/layout/Header.tsx
'use client';
import { useBrease, BreaseLink } from 'brease-next';

export function Header() {
  const { navigations, alternateLinks, availableLocales, locale } = useBrease();
  const nav = navigations.mainNavigation;

  return (
    <header>
      <nav>
        {nav?.items.map((item) => (
          <BreaseLink key={item.uuid} link={item}>{item.value}</BreaseLink>
        ))}
      </nav>
      <div className="language-selector">
        {availableLocales.map((loc) => (
          <a
            key={loc}
            href={alternateLinks[loc] || `/${loc}`}
            aria-current={loc === locale ? 'page' : undefined}
          >
            {loc.toUpperCase()}
          </a>
        ))}
      </div>
    </header>
  );
}
```

### Component Map

Maps section types from the CMS to React components, and defines which navigations/collections to load in the context.

```tsx
// lib/brease/component-map.ts
import type { BreaseContextConfig } from 'brease-next';
import { HeroSection } from '@/components/section/HeroSection';
import { ContentSection } from '@/components/section/ContentSection';

export const componentMap: Record<string, React.ComponentType<any>> = {
  hero: HeroSection,
  content: ContentSection,
};

export const contextData: BreaseContextConfig = {
  navigations: [
    { key: 'mainNavigation', id: 'nav-xxxxx' },
  ],
  collections: [],
  userParams: {},
};
```

### Sitemap

```tsx
// app/sitemap.ts
import { generateSitemap } from 'brease-next';

export default async function sitemap() {
  const result = await generateSitemap();
  if (result.success) return result.data;
  return [];
}
```

### Robots

```tsx
// app/robots.ts
import { generateBreaseRobots } from 'brease-next';

export default function robots() {
  return generateBreaseRobots('https://example.com');
}
```

### On-Demand Revalidation

The package handles webhook requests from the CMS: you only expose the route. No configuration in your app — the handler reads `BREASE_REVALIDATION_SECRET` from the environment and performs revalidation.

Add this file so the backend can trigger rebuilds:

```ts
// app/api/revalidate/route.ts
export { revalidateHandler as POST } from 'brease-next/server';
```

Set `BREASE_REVALIDATION_SECRET` in your environment (same value the backend sends when it calls the webhook). When content is published, the CMS POSTs to this endpoint; the package invalidates the relevant cache and the next visitor gets fresh content.

## Caching Strategy

All fetch calls use **tag-based caching**. Pages are cached indefinitely and only invalidated when the CMS fires a webhook with the relevant tags.

| Fetch Function | Cache Tags |
|---|---|
| `fetchPage(slug)` | `brease-page`, `brease-page-{slug}` |
| `fetchNavigation(id, locale)` | `brease-nav`, `brease-nav-{id}` |
| `fetchCollectionById(id, locale)` | `brease-collection`, `brease-collection-{id}` |
| `fetchEntryById(colId, entryId, locale)` | `brease-entry`, `brease-entry-{entryId}` |
| `fetchLocales()` | `brease-locales` |
| `fetchAllPages(locale)` | `brease-pages` |
| `fetchAlternateLinks(slug)` | `brease-alternates`, `brease-alternates-{slug}` |
| `fetchSite()` | `brease-site` |
| `generateSitemap()` | `brease-sitemap` |

For local development (`develop`, `preview`, `local` environments), caching is disabled (`cache: 'no-store'`) so changes reflect immediately without webhooks.

## Error Handling

All fetch functions return a `BreaseResponse<T>` type:

```typescript
type BreaseResponse<T> =
  | { success: true; data: T; status: number }
  | { success: false; error: string; status: number; endpoint?: string };
```

Always check `success` before accessing data:

```typescript
const result = await fetchPage('about');

if (!result.success) {
  console.error('Failed to fetch page:', result.error);
  return <ErrorPage message={result.error} />;
}

const page = result.data;
```

Use `ensureSuccess()` to throw on failure (preserves stale cache in ISR):

```typescript
import { ensureSuccess, fetchPage } from 'brease-next';

const page = ensureSuccess(await fetchPage('about'));
```

## API Reference

### Configuration

#### `validateBreaseConfig()`

Validates and returns the Brease configuration from environment variables.

### Fetch Functions

| Function | Description |
|---|---|
| `fetchSite()` | Fetches site-level information |
| `fetchPage(slug)` | Fetches a page by slug |
| `fetchAllPages(locale)` | Fetches all pages for a locale |
| `fetchCollectionById(id, locale)` | Fetches a collection with entries |
| `fetchEntryById(colId, entryId, locale)` | Fetches a collection entry |
| `fetchNavigation(navId, locale)` | Fetches navigation data |
| `fetchAlternateLinks(slug)` | Fetches alternate language links for a page |
| `fetchLocales()` | Fetches available locales |
| `fetchRedirects()` | Fetches all redirects |

### Generators

| Function | Description |
|---|---|
| `generateBreasePageParams()` | Generates `generateStaticParams` output for catch-all routes |
| `generateBreasePageMetadata(page, options?)` | Generates Next.js `Metadata` from page data |
| `generateBreaseRobots(siteUrl)` | Generates `robots.txt` config |
| `generateSitemap()` | Fetches sitemap data from CMS |

### Components

| Component | Description |
|---|---|
| `<BreasePage page sectionMap>` | Renders page sections mapped to React components |
| `<BreaseContext config locale>` | Server component providing navigation/collection data |
| `<BreaseImage breaseImage>` | Optimized image with responsive srcSet from variants |
| `<BreaseLink link>` | Smart link (Next.js `Link` for internal, `<a>` for external) |
| `<BreaseStructuredData page>` | Renders JSON-LD structured data from page |
| `<BreaseCustomCode page>` | Renders page-level custom code (e.g. analytics, tracking scripts) |
| `<BreasePageAlternates links>` | Pushes alternate links into context for language selector |

### Hooks

#### `useBrease()`

Access navigation, collection, locale, and alternate links data in client components. Must be used within a `BreaseContext`.

```typescript
const {
  navigations,
  collections,
  availableLocales,
  locale,
  alternateLinks,
  userParams,
} = useBrease();
```

## Development

### Building

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

## TypeScript Support

All types are exported:

```typescript
import type {
  BreasePageType,
  BreaseSection,
  BreaseMedia,
  BreaseNavigation,
  BreaseCollection,
  BreaseConfig,
} from 'brease-next';
```

## Publishing & Releases

This package uses automated GitHub Actions workflows for publishing to npm and creating releases.

### Setup Requirements

1. Generate an npm token with **Automation** or **Publish** permissions at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
2. Add it as a secret named `NPM_TOKEN` in your GitHub repository settings

### Creating a Release

1. Update the version in `package.json`:
   ```bash
   npm version patch  # Bug fixes (0.1.0 → 0.1.1)
   npm version minor  # New features (0.1.0 → 0.2.0)
   npm version major  # Breaking changes (0.1.0 → 1.0.0)
   ```

2. Update CHANGELOG.md

3. Commit and push with tags:
   ```bash
   git add . && git commit -m "chore: release vX.Y.Z"
   git push && git push --tags
   ```

The GitHub Actions workflow will automatically build, publish to npm, and create a GitHub release.

## License

ISC
