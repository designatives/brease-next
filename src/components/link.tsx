import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { BreaseLinkData } from "../types";

type AnchorProps = ComponentProps<"a">;
type NextLinkProps = ComponentProps<typeof Link>;

type BreaseLinkProps = {
  linkData: BreaseLinkData;
  children: ReactNode;
} & Omit<AnchorProps, "href" | "title"> &
  Omit<NextLinkProps, "href" | "title">;

const NEXT_LINK_ONLY_PROPS = [
  "prefetch",
  "replace",
  "scroll",
  "shallow",
  "passHref",
  "locale",
  "legacyBehavior",
  "as",
] as const;

/**
 * Renders a link from Brease link data. Uses Next.js Link for internal URLs
 * and a plain anchor with target="_blank" and rel="noopener noreferrer" for external links.
 *
 * @param linkData - Link element value from Brease
 * @param children - Content to render inside the link
 * @param rest - Additional anchor/Link attributes (e.g. className)
 */
export function BreaseLink({ linkData, children, ...rest }: BreaseLinkProps) {
  const target = linkData.target === "_blank" ? "_blank" : undefined;

  if (linkData.isExternal) {
    // Strip Next.js Link-specific props so they don't leak onto the native <a>
    // and trigger React warnings like "Received `true` for a non-boolean attribute `prefetch`".
    const anchorRest: Record<string, unknown> = { ...rest };
    for (const key of NEXT_LINK_ONLY_PROPS) {
      delete anchorRest[key];
    }

    return (
      <a
        title={linkData.label}
        href={linkData.value}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        {...anchorRest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={linkData.value}
      title={linkData.label}
      target={target}
      {...rest}
    >
      {children}
    </Link>
  );
}
