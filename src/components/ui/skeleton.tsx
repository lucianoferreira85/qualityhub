import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-badge bg-surface-tertiary bg-shimmer bg-[length:200%_100%] animate-shimmer",
        className
      )}
    />
  );
}

interface CardSkeletonProps {
  lines?: number;
  className?: string;
}

function CardSkeleton({ lines = 3, className }: CardSkeletonProps) {
  return (
    <Card className={className}>
      <CardContent className="p-5">
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "h-4",
                i === 0 && "w-1/4",
                i === 1 && "w-3/4 h-5",
                i === 2 && "w-1/2",
                i > 2 && "w-2/3"
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <div className="border border-stroke-secondary rounded-card overflow-hidden bg-surface-primary shadow-xs">
      <table className="w-full">
        <thead>
          <tr className="border-b border-stroke-secondary">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className={cn("h-3", i === 0 ? "w-16" : "w-20")} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-stroke-secondary last:border-b-0">
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="px-4 py-3.5">
                  <Skeleton className={cn("h-4", j === 0 ? "w-20" : i % 2 === 0 ? "w-3/4" : "w-1/2")} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-button" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-64 rounded-input" />
        <Skeleton className="h-9 w-36 rounded-input" />
        <Skeleton className="h-9 w-36 rounded-input" />
      </div>
      <TableSkeleton />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-48 rounded-button" />
          <Skeleton className="h-9 w-32 rounded-button" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} lines={5} />
        ))}
      </div>
    </div>
  );
}

function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FormPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-7 w-56" />
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-input" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-24 w-full rounded-input" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-3">
        <Skeleton className="h-10 w-24 rounded-button" />
        <Skeleton className="h-10 w-32 rounded-button" />
      </div>
    </div>
  );
}

function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-2 border-b border-stroke-secondary pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-button" />
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full rounded-input" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-44 rounded-button" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  ListPageSkeleton,
  DashboardSkeleton,
  DetailPageSkeleton,
  FormPageSkeleton,
  SettingsPageSkeleton,
  NotificationsPageSkeleton,
};
