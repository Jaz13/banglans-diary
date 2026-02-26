export function BananaLeafSVG({ width = 80, className = '' }: { width?: number; className?: string }) {
  const h = Math.round(width * 2.5)
  return (
    <svg width={width} height={h} viewBox="0 0 80 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M40 0 C55 25 70 70 65 110 C60 150 50 180 40 200 C30 180 20 150 15 110 C10 70 25 25 40 0Z" fill="currentColor" opacity="0.4"/>
      <path d="M40 5 L40 195" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
      <path d="M40 35 C55 40 72 37 80 30" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
      <path d="M40 65 C55 70 70 67 78 60" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
      <path d="M40 95 C54 100 68 97 76 90" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
      <path d="M40 125 C52 130 64 127 70 120" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
      <path d="M40 35 C25 40 8 37 0 30" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
      <path d="M40 65 C25 70 10 67 2 60" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
      <path d="M40 95 C26 100 12 97 4 90" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
    </svg>
  )
}
