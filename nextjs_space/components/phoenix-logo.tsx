import Image from 'next/image';
import type { CSSProperties } from 'react';

interface PhoenixLogoProps {
  /** Sizing / animation classes applied to the positioned wrapper (e.g. "w-8 h-8"). */
  className?: string;
  /** Accessible alt text. Defaults to "Phoenix AI". */
  alt?: string;
  /** Extra classes appended to the image's object-contain (e.g. "drop-shadow-lg"). */
  imageClassName?: string;
  /** Inline style for the wrapper (e.g. 3D perspective on the hero logo). */
  style?: CSSProperties;
  /** Forwarded to next/image priority. */
  priority?: boolean;
}

/**
 * Phoenix AI brand logo. Always renders /logo.png at its intrinsic aspect ratio
 * (object-contain) with transparency preserved. No CSS filters or recolouring
 * are applied. Sizing and spacing come from the wrapper `className`, matching the
 * existing `relative w-X h-Y` + `fill object-contain` usage across the app.
 */
export function PhoenixLogo({
  className = '',
  alt = 'Phoenix AI',
  imageClassName = '',
  style,
  priority,
}: PhoenixLogoProps) {
  return (
    <div className={`relative ${className}`.trim()} style={style}>
      <Image
        src="/logo.png"
        alt={alt}
        fill
        className={`object-contain ${imageClassName}`.trim()}
        priority={priority}
      />
    </div>
  );
}
