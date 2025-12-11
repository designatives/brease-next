import Image, { ImageProps } from 'next/image.js';
import type { BreaseMedia } from '../types.js';

type BreaseImageProps = Omit<ImageProps, 'src'> & {
  breaseImage: BreaseMedia;
  variant?: 'sm' | 'md' | 'lg' | 'xl' | 'hd' | 'original';
  alt?: string;
};

export function BreaseImage({
  breaseImage,
  className,
  width,
  height,
  alt,
  variant,
  ...rest
}: BreaseImageProps) {
  if (!breaseImage) return null;

  return (
    <Image
      src={
        (variant && breaseImage.variants && breaseImage.variants[variant].path) || breaseImage.path
      }
      alt={alt || breaseImage.alt || breaseImage.name || 'Image alt.'}
      width={width || breaseImage.width || 128}
      height={height || breaseImage.height || 128}
      className={className}
      {...rest}
    />
  );
}
