/**
 * Main entry point for brease-next.
 *
 * This module provides a unified API for both server and client components.
 * The build system ensures proper separation:
 * - Server components (BreaseContext, fetch functions) stay server-only
 * - Client components (useBrease, BreasePage, BreaseImage) get 'use client'
 *
 * For explicit imports, use:
 * - 'brease-next/client' for client-only components
 * - 'brease-next/server' for server-only utilities (redirects)
 */

// ============================================================
// TYPE EXPORTS (available everywhere)
// ============================================================
export type {
  BreaseSection,
  SectionElementProps,
  BreaseMedia,
  BreaseMediaVariant,
  BreaseNavigation,
  BreaseNavigationItem,
  BreasePage as BreasePageType,
  BreaseSite,
  BreaseConfig,
  BreaseCollection,
  BreaseCollectionEntry,
} from './types.js';

// ============================================================
// SERVER EXPORTS (NO 'use client' - async functions allowed)
// ============================================================

// Server Component - async function that fetches data
export { default as BreaseContext, type BreaseContextConfig } from './context.js';

// Server-side data fetching functions
export {
  fetchSite,
  fetchPage,
  fetchAllPages,
  fetchCollectionById,
  fetchEntryBySlug,
  fetchNavigation,
  generateBreasePageParams,
  generateBreaseCollectionParams,
  generateBreasePageMetadata,
  validateBreaseConfig,
} from './api.js';

// ============================================================
// CLIENT EXPORTS (re-exported from client module with 'use client')
// ============================================================

// Client components and hooks - these come from client.ts which has 'use client'
export { BreasePage, BreaseImage, useBrease } from './client.js';
