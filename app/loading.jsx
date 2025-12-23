export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col pt-20 px-4 md:px-8 animate-pulse">
      
      {/* 1. Header Skeleton */}
      <div className="h-12 w-1/3 bg-secondary/30 mb-8 rounded-none" />

      {/* 2. Hero Area */}
      <div className="w-full h-64 bg-secondary/10 border border-border mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/20 to-transparent skew-x-12 animate-[shimmer_1s_infinite]" />
      </div>

      {/* 3. Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 border border-border bg-background flex flex-col">
                {/* Image Placeholder */}
                <div className="h-48 bg-secondary/20 border-b border-border relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/10 to-transparent skew-x-12 animate-[shimmer_1.5s_infinite]" />
                </div>
                {/* Content Placeholder */}
                <div className="p-4 space-y-3 flex-1">
                    <div className="h-4 w-3/4 bg-secondary/30 rounded-none" />
                    <div className="h-3 w-1/2 bg-secondary/20 rounded-none" />
                    <div className="flex gap-2 mt-4">
                        <div className="h-5 w-12 bg-secondary/20" />
                        <div className="h-5 w-12 bg-secondary/20" />
                    </div>
                </div>
            </div>
        ))}
      </div>

    </div>
  );
}