import { Skeleton } from "./ui/skeleton";

const SKELETON_COUNT = 5;

export function PhraseListSkeleton() {
  return (
    <ul className="flex flex-col gap-3 sm:gap-4">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <li key={i}>
          <Skeleton className="h-28 w-full rounded-xl" />
        </li>
      ))}
    </ul>
  );
}
