import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse bg-surface-tertiary rounded", className)}
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

export { Skeleton, CardSkeleton };
