export type {
  BreaseSection,
  SectionElementProps,
  BreaseMedia,
  BreaseMediaVariant,
  BreaseNavigation,
  BreaseNavigationItem,
  BreaseLinkData,
  BreasePage as BreasePageType,
  BreaseSite,
  BreaseConfig,
  BreaseCollection,
  BreaseCollectionEntry,
} from "./types.js";

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
  generateBreaseRobots,
  generateSitemap,
  validateBreaseConfig,
} from "./api.js";
export type { GenerateBreaseRobotsOptions } from "./api.js";

export { BreaseFetchError } from "./errors.js";
export { ensureSuccess } from "./utils.js";

export { default as BreasePage } from "./components/page.js";
export { BreaseImage } from "./components/image.js";
export { BreaseLink } from "./components/link.js";
export { BreaseStructuredData } from "./components/structured-data.js";
export { BreaseCustomCode } from "./components/custom-code.js";

export {
  default as BreaseContext,
  type BreaseContextConfig,
  type BreaseGetPage,
} from "./context.js";
export { useBrease } from "./hooks.js";
