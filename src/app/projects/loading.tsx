
import { ChefHat } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8 animate-pulse">
           <div className="space-y-4">
              <div className="h-6 w-32 bg-chef-panel rounded-full" />
              <div className="h-12 w-64 bg-chef-panel rounded-xl" />
              <div className="h-4 w-48 bg-chef-panel rounded-lg" />
           </div>
           <div className="h-10 w-48 bg-chef-panel rounded-lg" />
        </div>

        {/* Projects Grid Skeleton */}
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col md:flex-row gap-8 bg-chef-panel/30 border border-chef-border p-8 rounded-xl animate-pulse">
               <div className="w-full md:w-60 aspect-[4/3] rounded-xl bg-chef-panel shrink-0" />
               <div className="flex-1 space-y-4 py-4">
                  <div className="h-4 w-20 bg-chef-panel rounded-full" />
                  <div className="h-8 w-3/4 bg-chef-panel rounded-lg" />
                  <div className="h-12 w-full bg-chef-panel rounded-xl" />
                  <div className="flex gap-4">
                     <div className="h-3 w-16 bg-chef-panel rounded-full" />
                     <div className="h-3 w-16 bg-chef-panel rounded-full" />
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
