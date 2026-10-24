import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

export function FormulaCardSkeleton() {
  return (
    <div className="surface-card flex items-center gap-3 p-4">
      <Skeleton className="h-11 w-11 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-6 px-4 py-4" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: 3 }).map((_, index) => (
        <FormulaCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function FormulaSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4" aria-busy="true">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-10 w-full rounded-full" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
      <Skeleton className="h-14 w-full rounded-full" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 px-4 py-4" aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <FormulaCardSkeleton key={index} />
      ))}
    </div>
  );
}
