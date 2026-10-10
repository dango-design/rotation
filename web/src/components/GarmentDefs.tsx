import { GARMENT_DEFS } from '@/lib/garments';

/** Shared definitions used by every garment illustration (garmentSvg references them by id). Render once per page. */
export function GarmentDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs dangerouslySetInnerHTML={{ __html: GARMENT_DEFS }} />
    </svg>
  );
}
