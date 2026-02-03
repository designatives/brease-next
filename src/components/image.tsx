import Image, { ImageProps } from 'next/image.js';
import type { BreaseMedia, BreaseMediaVariant } from '../types.js';

const VARIANT_ORDER = ['sm', 'md', 'lg', 'xl', '2xl', 'hd', 'original'] as const;

function buildSrcSetFromVariants(variants: Record<string, BreaseMediaVariant>): string {
  const entries = VARIANT_ORDER.filter((key) => variants[key]?.path).map((key) => {
    const v = variants[key];
    return `${v.path} ${v.width}w`;
  });
  return entries.join(', ');
}

const DEFAULT_SIZES =
  '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 25vw';

type BreaseImageProps = Omit<ImageProps, 'src' | 'alt' | 'srcSet' | 'sizes'> & {
  breaseImage: BreaseMedia;
  variant?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hd' | 'original';
  alt?: string;
  sizes?: string;
};

export function BreaseImage({
  breaseImage,
  className,
  width,
  height,
  alt,
  variant,
  sizes: sizesProp,
  ...rest
}: BreaseImageProps) {
  if (!breaseImage) return null;

  const hasVariants = breaseImage.variants && Object.keys(breaseImage.variants).length > 0;
  const useResponsiveSrcSet = !variant && hasVariants;

  const src = (variant && hasVariants && breaseImage.variants[variant]?.path) || breaseImage.path;

  const variantList = hasVariants
    ? VARIANT_ORDER.filter((key) => breaseImage.variants[key]).map(
        (key) => breaseImage.variants[key]
      )
    : [];
  const maxVariant =
    variantList.length > 0 ? variantList.reduce((a, b) => (a.width >= b.width ? a : b)) : null;
  const displayWidth = width ?? maxVariant?.width ?? breaseImage.width ?? 128;
  const displayHeight = height ?? maxVariant?.height ?? breaseImage.height ?? 128;

  return (
    <Image
      src={src}
      alt={alt ?? breaseImage.alt ?? breaseImage.name ?? 'Image alt.'}
      width={displayWidth}
      height={displayHeight}
      className={className}
      {...(useResponsiveSrcSet && {
        srcSet: buildSrcSetFromVariants(breaseImage.variants),
        sizes: sizesProp ?? DEFAULT_SIZES,
        unoptimized: true,
      })}
      {...rest}
    />
  );
}
