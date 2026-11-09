import Image, { type StaticImageData } from "next/image";

/**
 * Photographic imagery (Pexels, free to use — credits in docs/photo-credits.md).
 *
 * These are generic illustrative photographs of activities (learning, building a
 * business, volunteering). They must never be captioned or placed as NEN recipients,
 * beneficiaries, testimonials or "people we helped" — see HANDOFF.md §0.
 */

/** Full-width header band with a soft navy wash so photos sit on the site palette. */
export function PhotoBand({ src, alt, className = "h-36 sm:h-44" }: { src: StaticImageData; alt: string; className?: string }) {
  return (
    <div className={`relative w-full overflow-hidden rounded-2xl ${className}`}>
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 1200px" className="object-cover" priority={false} />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-navy-900/35 via-navy-900/10 to-transparent" />
    </div>
  );
}

/** Framed photograph used beside text or as a card image. */
export function PhotoFigure({ src, alt, className = "aspect-[4/3]", imgClassName = "object-cover" }: { src: StaticImageData; alt: string; className?: string; imgClassName?: string }) {
  return (
    <div className={`relative w-full overflow-hidden rounded-2xl ${className}`}>
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 800px" className={imgClassName} />
    </div>
  );
}
