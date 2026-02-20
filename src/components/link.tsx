import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

export type BreaseLinkData = {
  label: string;
  isExternal: boolean;
  value: string;
  target: '_blank' | 'self' | null;
};

type AnchorProps = ComponentProps<'a'>;
type NextLinkProps = ComponentProps<typeof Link>;

type BreaseLinkProps = {
  linkData: BreaseLinkData;
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
  const target = linkData.target === '_blank' ? '_blank' : undefined;

  if (linkData.isExternal) {
    return (
      <a
        title={linkData.label}
        href={linkData.value}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={linkData.value} title={linkData.label} target={target} {...rest}>
      {children}
    </Link>
  );
}
