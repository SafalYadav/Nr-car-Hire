import { cn } from '@/lib/utils/cn';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-[--radius-md] bg-muted', className)} {...props} />
  );
}

export { Skeleton };
