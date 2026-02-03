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
  generateBreasePageParams,
  generateBreaseCollectionParams,
  generateBreasePageMetadata,
  validateBreaseConfig,
} from './api.js';

export { default as BreasePage } from './components/page.js';
export { BreaseImage } from './components/image.js';
export { BreaseLink } from './components/link.js';

export { default as BreaseContext, type BreaseContextConfig } from './context.js';
export { useBrease } from './hooks.js';
