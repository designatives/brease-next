import type { BreasePage } from "../types.js";

/**
 * Renders page-level custom code from the CMS (e.g. analytics, tracking scripts, or inline HTML).
 * Renders nothing when customCode is null or empty.
 */
export function BreaseCustomCode({ page }: { page: BreasePage }) {
  if (!page.customCode || page.customCode.trim() === "") return null;
  return (
    <div
      className="brease-custom-code"
      dangerouslySetInnerHTML={{ __html: page.customCode }}
    />
  );
}
