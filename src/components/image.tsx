import Image from 'next/image';
import type { BreaseMedia } from '../types.js';

export function BreaseImage({
  breaseImage,
  className,
}: {
  breaseImage: BreaseMedia;
  className?: string;
}) {
  if (!breaseImage) {
    return null;
  }

  return (
    <Image
      src={breaseImage.path}
      alt={breaseImage.alt || breaseImage.name || 'Image alt.'}
      width={breaseImage.width}
      height={breaseImage.height}
      className={className}
    />
  );
}
