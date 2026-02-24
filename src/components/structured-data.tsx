import type { BreasePage } from "../types.js";

export function BreaseStructuredData({ page }: { page: BreasePage }) {
  if (!page.structuredData || page.structuredData.length === 0) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(page.structuredData),
      }}
    />
  );
}
