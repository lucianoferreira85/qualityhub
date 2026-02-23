import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-button" />
        <Skeleton className="h-7 w-32" />
      </div>

      <div className="bg-surface-primary rounded-card shadow-card border border-stroke-secondary overflow-hidden">
        <Skeleton className="h-24 w-full" />
        <div className="pt-12 px-6 pb-6 space-y-6">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-1.5" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-1.5" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>

      <div className="bg-surface-primary rounded-card shadow-card border border-stroke-secondary p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
