export default function AppLoading() {
  return (
    <div className="animate-in fade-in duration-200">
      {/* Title skeleton */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="h-10 w-56 bg-secondary rounded-xl animate-pulse mb-2" />
          <div className="rock-divider mb-3" />
          <div className="h-4 w-40 bg-secondary/60 rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-secondary rounded-full animate-pulse" />
      </div>

      {/* Content skeleton grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-secondary animate-pulse"
            style={{
              height: `${160 + (i % 3) * 40}px`,
              animationDelay: `${i * 80}ms`,
              animationDuration: '1.2s',
            }}
          />
        ))}
      </div>
    </div>
  )
}
