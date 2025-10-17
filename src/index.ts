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
  BreaseRedirect,
} from './types.js';

export {
  fetchSite,
  fetchPage,
  fetchAllPages,
  fetchCollectionById,
  fetchEntryBySlug,
  fetchNavigation,
  fetchRedirects,
  generateBreasePageParams,
  generateBreaseCollectionParams,
  generateBreasePageMetadata,
} from './api.js';

export { default as BreasePage } from './components/page.js';
export { BreaseImage } from './components/image.js';

export { default as BreaseContext, type BreaseContextConfig } from './context.js';
export { useBrease } from './hooks.js';
