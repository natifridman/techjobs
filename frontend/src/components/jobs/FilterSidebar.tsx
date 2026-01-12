import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
  "AI/ML", "AdTech", "Aerospace", "AR/VR", "Automotive", "Cloud Computing",
  "Cybersecurity", "Digital Media", "E-commerce & Retail", "Fintech", "Gaming",
  "Health", "IoT", "Productivity", "Robotics & Automation", "Semiconductors",
  "Sustainable Technology", "Telecommunications"
];

const jobCategories = [
  "software", "frontend", "devops", "data-science", "design", "product",
  "project-management", "qa", "security", "hardware", "marketing", "sales",
  "hr", "finance", "legal", "business", "admin", "procurement-operations", "support"
];

const levels = ["Junior", "Mid-Level", "Senior", "Staff", "Lead", "Team Lead", "Manager", "Director", "Executive", "Intern"];

const sizes = [
  { value: "xs", label: "1-10" },
  { value: "s", label: "11-50" },
  { value: "m", label: "51-200" },
  { value: "l", label: "201-1,000" },
  { value: "xl", label: "1,001+" }
];

export interface Filters {
  search: string;
  categories: string[];
  jobCategories: string[];
  levels: string[];
  sizes: string[];
  cities: string[];
}

interface FilterSidebarProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  cities: string[];
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function FilterSidebar({
  filters,
  setFilters,
  cities,
  isOpen,
  onClose,
  isMobile
}: FilterSidebarProps) {
  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleJobCategoryToggle = (jobCat: string) => {
    setFilters(prev => ({
      ...prev,
      jobCategories: prev.jobCategories.includes(jobCat)
        ? prev.jobCategories.filter(c => c !== jobCat)
        : [...prev.jobCategories, jobCat]
    }));
  };

  const handleLevelToggle = (level: string) => {
    setFilters(prev => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter(l => l !== level)
        : [...prev.levels, level]
    }));
  };

  const handleSizeToggle = (size: string) => {
    setFilters(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleCityToggle = (city: string) => {
    setFilters(prev => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city]
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      categories: [],
      jobCategories: [],
      levels: [],
      sizes: [],
      cities: []
    });
  };

  const activeFiltersCount =
    filters.categories.length +
    filters.jobCategories.length +
    filters.levels.length +
    filters.sizes.length +
    filters.cities.length;

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-warm-200 flex items-center justify-between">
        <h2 className="font-semibold text-warm-900">Filters</h2>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-warm-500 hover:text-warm-700"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Job Category */}
          <div>
            <h3 className="font-medium text-sm text-warm-900 mb-3">Job Category</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {jobCategories.map(jobCat => (
                <div key={jobCat} className="flex items-center space-x-2">
                  <Checkbox
                    id={`job-${jobCat}`}
                    checked={filters.jobCategories.includes(jobCat)}
                    onCheckedChange={() => handleJobCategoryToggle(jobCat)}
                  />
                  <Label htmlFor={`job-${jobCat}`} className="text-sm text-warm-600 capitalize cursor-pointer">
                    {jobCat.replace(/-/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Level */}
          <div>
            <h3 className="font-medium text-sm text-warm-900 mb-3">Experience Level</h3>
            <div className="space-y-2">
              {levels.map(level => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={`level-${level}`}
                    checked={filters.levels.includes(level)}
                    onCheckedChange={() => handleLevelToggle(level)}
                  />
                  <Label htmlFor={`level-${level}`} className="text-sm text-warm-600 cursor-pointer">
                    {level}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Industry */}
          <div>
            <h3 className="font-medium text-sm text-warm-900 mb-3">Industry</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${category}`}
                    checked={filters.categories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <Label htmlFor={`cat-${category}`} className="text-sm text-warm-600 cursor-pointer">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Company Size */}
          <div>
            <h3 className="font-medium text-sm text-warm-900 mb-3">Company Size</h3>
            <div className="space-y-2">
              {sizes.map(size => (
                <div key={size.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`size-${size.value}`}
                    checked={filters.sizes.includes(size.value)}
                    onCheckedChange={() => handleSizeToggle(size.value)}
                  />
                  <Label htmlFor={`size-${size.value}`} className="text-sm text-warm-600 cursor-pointer">
                    {size.label} employees
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Cities */}
          {cities.length > 0 && (
            <div>
              <h3 className="font-medium text-sm text-warm-900 mb-3">City</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cities.map(city => (
                  <div key={city} className="flex items-center space-x-2">
                    <Checkbox
                      id={`city-${city}`}
                      checked={filters.cities.includes(city)}
                      onCheckedChange={() => handleCityToggle(city)}
                    />
                    <Label htmlFor={`city-${city}`} className="text-sm text-warm-600 cursor-pointer">
                      {city}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-80 z-50 shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="hidden lg:block w-72 border-r border-warm-200 h-full bg-white">
      {sidebarContent}
    </div>
  );
}
