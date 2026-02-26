export function VinylSVG({ width = 300, className = '' }: { width?: number; className?: string }) {
  return (
    <svg width={width} height={width} viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="150" cy="150" r="148" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.05"/>
      <circle cx="150" cy="150" r="120" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
      <circle cx="150" cy="150" r="100" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
      <circle cx="150" cy="150" r="80" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
      <circle cx="150" cy="150" r="60" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
      <circle cx="150" cy="150" r="40" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
      <circle cx="150" cy="150" r="25" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1"/>
      <circle cx="150" cy="150" r="8" fill="currentColor" opacity="0.6"/>
      <circle cx="150" cy="150" r="3" fill="currentColor" opacity="0.9"/>
    </svg>
  )
}
