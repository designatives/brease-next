# brease-next

Official Next.js integration for Brease CMS - React components, hooks, and utilities for seamless headless CMS content management.

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
BREASE_REVALIDATION_TIME=30  # Optional: Cache revalidation time in seconds
```

## Usage

### Fetching Pages

```typescript
import { fetchPage, BreasePage } from 'brease-next';

export default async function Page({ params }: { params: { slug: string } }) {
  const result = await fetchPage(params.slug);

  if (!result.success) {
    return <div>Error: {result.error}</div>;
  }

  const page = result.data;

  return (
    <BreasePage
      page={page}
      sectionMap={{
        'hero': HeroSection,
        'content': ContentSection,
        // Map your section types to components
      }}
    />
  );
}
```

### Generating Static Params

For static site generation, use the provided helper functions:

```typescript
import { generateBreasePageParams } from 'brease-next';

export async function generateStaticParams() {
  return await generateBreasePageParams();
}
```

### Fetching Collections

```typescript
import { fetchCollectionById, fetchEntryBySlug } from 'brease-next';

// Fetch a collection with all its entries
const collectionResult = await fetchCollectionById('collection-id');
if (collectionResult.success) {
  const collection = collectionResult.data;
  console.log(collection.name, collection.status);
  collection.entries.forEach(entry => {
    // Access each entry
  });
}

// Fetch a specific entry by slug
const entryResult = await fetchEntryBySlug('collection-id', 'entry-slug');
```

### Using the Context Provider

Wrap your application with `BreaseContext` to provide navigation and collection data to all components:

```typescript
import { BreaseContext } from 'brease-next';

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <BreaseContext
      config={{
        navigations: [
          { key: 'header', id: 'nav-id-1' },
          { key: 'footer', id: 'nav-id-2' }
        ],
        collections: [
          { key: 'posts', id: 'collection-id' }
        ]
      }}
    >
      {children}
    </BreaseContext>
  );
}
```

### Using the Hook

Access navigation and collection data in client components:

```typescript
'use client';

import { useBrease } from 'brease-next';

export function Navigation() {
  const { navigations, collections } = useBrease();
  const headerNav = navigations.header;

  return (
    <nav>
      {headerNav?.items.map((item) => (
        <a key={item.value} href={item.url}>
          {item.value}
        </a>
      ))}
    </nav>
  );
}
```

### Rendering Images

Use the `BreaseImage` component for optimized image rendering:

```typescript
import { BreaseImage } from 'brease-next';

export function MyComponent({ imageData }) {
  return <BreaseImage breaseImage={imageData} className="my-image" />;
}
```

### Generating Metadata

Generate SEO metadata for your pages:

```typescript
import { generateBreasePageMetadata } from 'brease-next';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return await generateBreasePageMetadata(params.slug);
}
```

### Handling Redirects

Fetch and implement redirects from Brease CMS:

```typescript
import { fetchRedirects } from 'brease-next';

export async function getRedirects() {
  const result = await fetchRedirects();

  if (result.success) {
    return result.data.map(redirect => ({
      source: redirect.source,
      destination: redirect.destination,
      permanent: redirect.permanent === '301'
    }));
  }

  return [];
}
```

## API Reference

### Fetch Functions

All fetch functions return a `BreaseResponse<T>` type with the following structure:

```typescript
type BreaseResponse<T> =
  | { success: true; data: T; status: number }
  | { success: false; error: string; status: number; endpoint?: string };
```

#### `fetchSite()`
Fetches site-level information.

#### `fetchPage(pageSlug: string)`
Fetches a specific page by slug.

#### `fetchAllPages()`
Fetches all available pages (useful for static generation).

#### `fetchCollectionById(collectionId: string)`
Fetches a collection by its ID, including metadata and all entries.

#### `fetchEntryBySlug(collectionId: string, entrySlug: string)`
Fetches a specific collection entry by slug.

#### `fetchNavigation(navigationId: string)`
Fetches navigation data by ID.

#### `fetchRedirects()`
Fetches all configured redirects.

### Components

#### `<BreasePage>`
Renders a page with its sections mapped to React components.

Props:
- `page: BreasePageType` - The page data from Brease
- `sectionMap: Record<string, React.ComponentType>` - Maps section types to components

#### `<BreaseImage>`
Renders an optimized Next.js Image component.

Props:
- `breaseImage: BreaseMedia` - The image data from Brease
- `className?: string` - Optional CSS class

#### `<BreaseContext>`
Server component that fetches and provides navigation and collection data.

Props:
- `config: BreaseContextConfig` - Configuration for navigations and collections to fetch
- `children: ReactNode` - Child components

### Hooks

#### `useBrease()`
Access navigation and collection data in client components. Must be used within a `BreaseContext`.

Returns:
```typescript
{
  navigations: Record<string, BreaseNavigation>;
  collections: Record<string, BreaseCollection>;
}
```

## Development

### Building

```bash
npm run build
```

This will generate both CommonJS and ESM builds with TypeScript declarations in the `dist/` folder.

### Watch Mode

```bash
npm run dev
```

## TypeScript Support

This package includes full TypeScript type definitions. All types are exported and can be imported:

```typescript
import type {
  BreasePage,
  BreaseSection,
  BreaseMedia,
  BreaseNavigation,
  BreaseResponse
} from 'brease-next';
```

## License

ISC
