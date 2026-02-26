export function GuitarPickSVG({ width = 40, className = '' }: { width?: number; className?: string }) {
  const h = Math.round(width * 1.25)
  return (
    <svg width={width} height={h} viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M20 2 C35 2 38 20 38 30 C38 42 29 48 20 48 C11 48 2 42 2 30 C2 20 5 2 20 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.25"/>
      <path d="M20 8 C30 8 32 20 32 28 C32 36 26 42 20 42 C14 42 8 36 8 28 C8 20 10 8 20 8Z" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.4"/>
    </svg>
  )
}
