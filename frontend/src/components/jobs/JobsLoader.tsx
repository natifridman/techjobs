import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function JobsLoader() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="bg-white rounded-xl border-warm-100">
          <CardContent className="p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
            <div className="mt-4 pt-4 border-t border-warm-100 flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
