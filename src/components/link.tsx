import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

export interface LinkData {
  url: string;
  label: string;
  isExternal?: boolean;
  value: string;
}

type AnchorProps = ComponentProps<'a'>;
type NextLinkProps = ComponentProps<typeof Link>;

type BreaseLinkProps = {
  linkData: LinkData;
  children: ReactNode;
} & Omit<AnchorProps, 'href' | 'title'> &
  Omit<NextLinkProps, 'href' | 'title'>;

/**
 * Renders a link from Brease link data. Uses Next.js Link for internal URLs
 * and a plain anchor with target="_blank" and rel="noopener noreferrer" for external links.
 *
 * @param linkData - Link element value from Brease
 * @param children - Content to render inside the link
 * @param rest - Additional anchor/Link attributes (e.g. className)
 */
export function BreaseLink({ linkData, children, ...rest }: BreaseLinkProps) {
  if (linkData.isExternal) {
    return (
      <a
        title={linkData.label}
        href={linkData.url}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={linkData.value} title={linkData.label} {...rest}>
      {children}
    </Link>
  );
}
