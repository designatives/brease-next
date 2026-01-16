# brease-next

[![npm version](https://img.shields.io/npm/v/brease-next.svg)](https://www.npmjs.com/package/brease-next)
[![npm downloads](https://img.shields.io/npm/dm/brease-next.svg)](https://www.npmjs.com/package/brease-next)
[![license](https://img.shields.io/npm/l/brease-next.svg)](https://github.com/designatives/brease-next/blob/main/LICENSE)
[![CI](https://github.com/designatives/brease-next/actions/workflows/ci.yml/badge.svg)](https://github.com/designatives/brease-next/actions/workflows/ci.yml)

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
BREASE_LOCALE=en  # Optional: Locale for content (defaults to 'en')
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

#### Turbopack Compatibility

This package is fully compatible with Next.js Turbopack. The build process automatically preserves `'use client'` directives in bundled output, so `BreaseContext` works correctly in server component layouts.

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

## Error Handling

All fetch functions return a `BreaseResponse<T>` type that includes both success and error states:

```typescript
type BreaseResponse<T> =
  | { success: true; data: T; status: number }
  | { success: false; error: string; status: number; endpoint?: string };
```

### Handling Errors

Always check the `success` property before accessing data:

```typescript
const result = await fetchPage('about');

if (!result.success) {
  // Handle error case
  console.error('Failed to fetch page:', result.error);
  console.error('Status code:', result.status);
  console.error('Endpoint:', result.endpoint);

  // Show error UI to user
  return <ErrorPage message={result.error} />;
}

// Safe to access data now
const page = result.data;
```

### Common Error Scenarios

- **Missing Environment Variables**: Ensure all required env vars are set (`BREASE_BASE_URL`, `BREASE_TOKEN`, `BREASE_ENV`)
- **Network Errors**: Check network connectivity and API availability
- **404 Not Found**: The requested resource (page, collection, etc.) doesn't exist
- **401 Unauthorized**: Invalid or expired `BREASE_TOKEN`
- **Rate Limiting**: Too many requests to the API

## API Reference

### Configuration

#### `validateBreaseConfig()`
Validates and returns the Brease configuration from environment variables. Useful for debugging configuration issues.

```typescript
import { validateBreaseConfig } from 'brease-next';

try {
  const config = validateBreaseConfig();
  console.log('Configuration is valid:', config);
} catch (error) {
  console.error('Configuration error:', error.message);
  // Handle missing or invalid environment variables
}
```

### Fetch Functions

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

## Publishing & Releases

This package uses automated GitHub Actions workflows for publishing to npm and creating releases.

### Setup Requirements

Before creating your first release, you need to add an npm token to your GitHub repository:

1. Generate an npm token with **Automation** or **Publish** permissions at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)
2. Add it as a secret named `NPM_TOKEN` in your GitHub repository settings:
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `NPM_TOKEN`
   - Value: Your npm token

### Creating a Release

To publish a new version to npm and create a GitHub release:

1. **Update the version** in `package.json`:
   ```bash
   npm version patch  # For bug fixes (0.1.0 → 0.1.1)
   npm version minor  # For new features (0.1.0 → 0.2.0)
   npm version major  # For breaking changes (0.1.0 → 1.0.0)
   ```

2. **Update CHANGELOG.md** with the new version and changes

3. **Commit the changes**:
   ```bash
   git add .
   git commit -m "chore: release v0.1.1"
   ```

4. **Push with tags**:
   ```bash
   git push && git push --tags
   ```

The GitHub Actions workflow will automatically:
- ✅ Run code quality checks (ESLint, Prettier)
- ✅ Build the package
- ✅ Publish to npm with provenance attestation
- ✅ Create a GitHub release with changelog content

### Continuous Integration

Every push to `main` and all pull requests automatically run:
- ESLint checks
- Prettier formatting verification
- Build verification on Node.js 16, 18, and 20

The CI status is visible in the badge at the top of this README.

## License

ISC
