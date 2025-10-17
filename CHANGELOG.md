# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
