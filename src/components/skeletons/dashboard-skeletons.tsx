export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="h-3.5 w-20 bg-muted rounded-md animate-pulse" />
            <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="h-8 w-14 bg-muted rounded-md animate-pulse mb-1.5" />
          <div className="h-3 w-24 bg-muted rounded-md animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function QuickLinksSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="h-11 w-11 bg-muted rounded-xl animate-pulse" />
            <div className="h-4 w-4 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-5 w-24 bg-muted rounded-md animate-pulse mb-2" />
          <div className="h-3 w-36 bg-muted rounded-md animate-pulse mb-3" />
          <div className="h-3 w-full bg-muted rounded-md animate-pulse" />
        </div>
      ))}
    </div>
  );
}
