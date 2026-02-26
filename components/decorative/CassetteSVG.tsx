export function CassetteSVG({ width = 120, className = '' }: { width?: number; className?: string }) {
  const h = Math.round(width * 0.667)
  return (
    <svg width={width} height={h} viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2" y="2" width="116" height="76" rx="6" stroke="currentColor" strokeWidth="2"/>
      <rect x="12" y="10" width="96" height="45" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="38" cy="46" r="12" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="38" cy="46" r="4" fill="currentColor" opacity="0.6"/>
      <circle cx="82" cy="46" r="12" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="82" cy="46" r="4" fill="currentColor" opacity="0.6"/>
      <path d="M50 46 Q60 38 70 46" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <rect x="20" y="14" width="80" height="16" rx="2" fill="currentColor" opacity="0.08"/>
      <circle cx="12" cy="8" r="2" fill="currentColor" opacity="0.4"/>
      <circle cx="108" cy="8" r="2" fill="currentColor" opacity="0.4"/>
      <circle cx="12" cy="72" r="2" fill="currentColor" opacity="0.4"/>
      <circle cx="108" cy="72" r="2" fill="currentColor" opacity="0.4"/>
      <rect x="54" y="62" width="12" height="6" rx="1" fill="currentColor" opacity="0.3"/>
    </svg>
  )
}
