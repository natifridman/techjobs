import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

interface SearchHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onFilterClick: () => void;
  totalJobs: number;
  activeFiltersCount: number;
}

export default function SearchHeader({ 
  searchQuery, 
  setSearchQuery, 
  onFilterClick, 
  totalJobs,
  activeFiltersCount 
}: SearchHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-warm-200">
      <div className="px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
            <Input
              type="text"
              placeholder="Search jobs, companies, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-warm-50 border-warm-200 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onFilterClick}
              className="lg:hidden h-11 gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-iris-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            <Button asChild variant="outline" className="h-11 gap-2">
              <Link to={createPageUrl("SavedJobs")}>
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">Saved</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-3 text-sm text-warm-500">
          {totalJobs.toLocaleString()} jobs found
        </div>
      </div>
    </div>
  );
}
