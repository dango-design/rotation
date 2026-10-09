/** Shared definitions used by every garment illustration (garmentSvg references them by id). Render once per page. */
export function GarmentDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="g-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".1" />
        </linearGradient>
        <pattern id="p-stripe" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#EFE9DC" />
          <rect y="7" width="12" height="4" fill="#25324B" />
        </pattern>
      </defs>
    </svg>
  );
}
