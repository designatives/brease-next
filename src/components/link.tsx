import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

export interface LinkData {
  url: string;
  label: string;
  isExternal?: boolean;
}

type AnchorProps = ComponentProps<'a'>;
type NextLinkProps = ComponentProps<typeof Link>;

type BreaseLinkProps = {
  linkData: LinkData;
  children?: ReactNode;
} & Omit<AnchorProps, 'href' | 'title'> &
  Omit<NextLinkProps, 'href' | 'title'>;

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
    <Link href={linkData.url} title={linkData.label} {...rest}>
      {children}
    </Link>
  );
}
