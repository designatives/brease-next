"use client";

import { useEffect } from "react";
import { useBreaseContext } from "../client-provider.js";

/**
 * Pushes page-specific alternate links into the Brease context
 * so the language selector in the header/navigation can use them.
 *
 * Render this in your page component alongside `<BreasePage>`:
 * ```tsx
 * <BreasePageAlternates links={pageResult.data.alternateLinks} />
 * ```
 */
export function BreasePageAlternates({
  links,
}: {
  links: Record<string, string> | null;
}) {
  const { setAlternateLinks } = useBreaseContext();
  useEffect(() => {
    if (links) setAlternateLinks(links);
  }, [links, setAlternateLinks]);
  return null;
}
