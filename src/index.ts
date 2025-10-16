export type {
  BreaseSection,
  BreaseMedia,
  BreaseMediaVariant,
  BreaseNavigation,
  BreasePage as BreasePageType,
  BreaseConfig,
  BreaseCollectionEntry,
  BreaseRedirect,
} from './types';

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
} from './client';

export { default as BreasePage } from './components/page';
export { BreaseImage } from './components/image';

export { default as BreaseContext, type BreaseContextConfig } from './context';
export { useBrease } from './hooks';
