// components/report/SummarySectionSkeleton.tsx

export default function SummarySectionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-20 bg-gray-200 dark:bg-gray-700 rounded shadow"
        ></div>
      ))}
    </div>
  );
}
