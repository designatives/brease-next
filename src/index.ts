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

export {
  fetchSite,
  fetchPage,
  fetchAllPages,
  fetchCollectionById,
  fetchEntryById,
  fetchNavigation,
  fetchAlternateLinks,
  fetchLocales,
  fetchRedirects,
  generateBreasePageParams,
  generateBreasePageMetadata,
  generateSitemap,
  validateBreaseConfig,
} from './api.js';

export { BreaseFetchError } from './errors.js';
export { ensureSuccess } from './utils.js';

export { default as BreasePage } from './components/page.js';
export { BreaseImage } from './components/image.js';
export { BreaseLink, BreaseLinkData } from './components/link.js';

export { default as BreaseContext, type BreaseContextConfig } from './context.js';
export { useBrease } from './hooks.js';
