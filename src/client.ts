'use client';

/**
 * Client-side exports for brease-next.
 *
 * This module contains all React components and hooks that require
 * client-side execution (using React context, hooks, etc.).
 *
 * Import from 'brease-next/client' for explicit client imports,
 * or from 'brease-next' for the combined API.
 */

// Re-export client provider and hook
export { BreaseClientProvider, useBreaseContext as useBrease } from './client-provider.js';
export type { BreaseContextData } from './client-provider.js';

// Re-export client components
export { default as BreasePage } from './components/page.js';
export { BreaseImage } from './components/image.js';

// Re-export types needed by client components
export type {
  BreaseSection,
  SectionElementProps,
  BreaseMedia,
  BreaseMediaVariant,
  BreasePage as BreasePageType,
  BreaseNavigation,
  BreaseNavigationItem,
  BreaseCollection,
  BreaseCollectionEntry,
} from './types.js';
