# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2026-05-07

### Changed

- Simplified caching to time-based ISR only. `BREASE_REVALIDATION_TIME`
  (optional, defaults to 30s) is now the single knob for cache freshness.

### Removed

- `BREASE_CACHE_MODE` environment variable. Apps that previously set it to
  `"isr"` need no changes. Apps that set it to `"no-store"` will now use
  ISR with the configured revalidation time; set `BREASE_REVALIDATION_TIME=0`
  if always-fresh behavior is required.

## [0.2.1] - 2026-04-20

### Fixed

- `BreaseClientProvider` now re-syncs its internal `page` and `alternateLinks`
  state when the server-rendered `brease` prop changes. Previously, because
  the provider is typically mounted in a persistent App Router `layout.tsx`,
  `useState` held onto the initial page forever — so navigating between pages
  re-fetched data on the server but the client UI kept rendering the first
  page. Preview mode's `setPage` flow still works unchanged.

## [0.2.0] - 2026-04-09

### Added

- Iframe preview integration with PostMessage handling
- Revalidation time handling for fresher CMS-driven data
- Brease metadata generation improvements

### Changed

- Reworked `useBrease` and Brease context for clearer data access
- Link component and link data handling (including webpack / module interop fixes)
- Normalized slugs and export surface for server and client entry points

### Fixed

- Errors from the CMS layer propagate correctly instead of being swallowed
- Page metadata, home page params generation, and related edge cases

## [0.1.0] - 2025-10-17

### Added
- Initial release of brease-next
- Server-side data fetching functions for pages, collections, navigations, and redirects
- React Server Components support with `BreaseContext` provider
- Client-side hooks with `useBrease()` for accessing CMS data
- `BreasePage` component for rendering dynamic page sections
- `BreaseImage` component with Next.js Image optimization
- TypeScript type definitions for all Brease CMS entities
- Comprehensive error handling with `BreaseResponse` type
- Static site generation helpers (`generateBreasePageParams`, `generateBreaseCollectionParams`)
- SEO metadata generation with `generateBreasePageMetadata`
- Full ESM and CommonJS support
- Environment-based configuration via env variables
