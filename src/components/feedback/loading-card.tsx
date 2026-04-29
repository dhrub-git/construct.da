import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

type LoadingCardProps = {
  lines?: number;
};

export function LoadingCard({ lines = 3 }: LoadingCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={`loading-card-line-${index}`} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
