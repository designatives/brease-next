"use client";

import Image, { ImageLoaderProps, ImageProps } from "next/image";
import type { BreaseMedia, BreaseMediaVariant } from "../types.js";

const VARIANT_ORDER = [
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "hd",
  "original",
] as const;

/**
 * Fallback `sizes`: assume the image spans the viewport. It never picks a file
 * narrower than the screen, so an image without `sizes` is never blurry; the
 * cost is over-fetching on wide layouts, which a real `sizes` value removes.
 */
const DEFAULT_SIZES = "100vw";

type BreaseImageProps = Omit<
  ImageProps,
  "src" | "alt" | "srcSet" | "sizes" | "loader"
> & {
  breaseImage: BreaseMedia;
  variant?: (typeof VARIANT_ORDER)[number];
  alt?: string;
  sizes?: string;
};

/**
 * Distinct variant files, narrowest first. Brease points every variant at or
 * above the source width to the same file, so those collapse into one entry.
 */
function distinctVariants(
  variants: Record<string, BreaseMediaVariant>,
): BreaseMediaVariant[] {
  const seen = new Set<string>();
  const list: BreaseMediaVariant[] = [];
  for (const key of VARIANT_ORDER) {
    const v = variants[key];
    if (!v?.path || seen.has(v.path)) continue;
    seen.add(v.path);
    list.push(v);
  }
  return list.sort((a, b) => a.width - b.width);
}

/**
 * next/image loader backed by the pre-rendered Brease variants. For each width
 * Next asks for, returns the narrowest variant at least that wide, or the
 * widest one available. `src` is ignored: the variant list has the URLs.
 */
function createVariantLoader(variants: BreaseMediaVariant[]) {
  const widest = variants[variants.length - 1];
  return ({ width }: ImageLoaderProps): string =>
    (variants.find((v) => v.width >= width) ?? widest).path;
}

/**
 * Props that make next/image build its srcset from the Brease variants.
 * next/image discards a custom `srcSet` prop, and `unoptimized` would also drop
 * `sizes`, so the variants have to go in through a `loader`.
 */
function variantProps(
  variants: BreaseMediaVariant[],
  sizes: string,
): Partial<ImageProps> {
  if (variants.length === 1) {
    // Source narrower than the smallest variant: one file, serve it as-is.
    return { src: variants[0].path, unoptimized: true };
  }
  return {
    // Seeds the loader (which ignores it) and is what next/image serves as-is
    // when the app disables optimization globally: the widest downscaled file.
    src: variants[variants.length - 2].path,
    loader: createVariantLoader(variants),
    sizes,
  };
}

/**
 * Renders a Brease media image using Next.js Image. Without a `variant`, the
 * Brease variants become a responsive srcset driven by `sizes`; with one, that
 * single variant is rendered.
 *
 * @param breaseImage - Brease media object (path, variants, alt, etc.)
 * @param variant - Optional size variant (sm, md, lg, xl, 2xl, hd, original)
 * @param sizes - `sizes` attribute for the responsive srcset. Defaults to
 *   `100vw`; pass the real layout width (e.g. `"(max-width: 1024px) 100vw, 50vw"`)
 *   so smaller files are picked on wide layouts.
 * @param rest - Additional Next.js Image props (alt, width, height, className, etc.)
 */
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

  const variants = breaseImage.variants
    ? distinctVariants(breaseImage.variants)
    : [];
  const widest = variants[variants.length - 1];
  const responsive = !variant && variants.length > 0;

  const src =
    (variant && breaseImage.variants?.[variant]?.path) || breaseImage.path;
  const displayWidth = width ?? widest?.width ?? breaseImage.width ?? 128;
  const displayHeight = height ?? widest?.height ?? breaseImage.height ?? 128;

  return (
    <Image
      src={src}
      alt={alt ?? breaseImage.alt ?? breaseImage.name ?? "Image alt."}
      width={displayWidth}
      height={displayHeight}
      className={className}
      sizes={sizesProp}
      {...(responsive && variantProps(variants, sizesProp ?? DEFAULT_SIZES))}
      {...rest}
    />
  );
}
