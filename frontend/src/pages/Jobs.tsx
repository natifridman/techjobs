import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Briefcase, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

import FilterSidebar, { type Filters } from "@/components/jobs/FilterSidebar";
import SearchHeader from "@/components/jobs/SearchHeader";
import JobCard from "@/components/jobs/JobCard";
import JobsLoader from "@/components/jobs/JobsLoader";
import { fetchAllJobs, type Job } from "@/components/jobs/jobsData";
import { savedJobsApi } from "@/api/storage";

// Types for mutation results
type SaveMutationResult = { action: 'saved' | 'removed'; job: Job };
type ApplyMutationResult = { action: 'applied' | 'unapplied'; job: Job };

const JOBS_PER_PAGE = 20;

export default function Jobs() {
  const posthog = usePostHog();
  const [filters, setFilters] = useState<Filters>({
    search: '',
    categories: [],
    jobCategories: [],
    levels: [],
    sizes: [],
    cities: []
  });
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Apply category from URL on mount
  useEffect(() => {
    if (initialCategory) {
      setFilters(prev => ({ ...prev, categories: [initialCategory] }));
    }
  }, [initialCategory]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Update local state when URL param changes
  useEffect(() => {
    const query = new URLSearchParams(location.search).get('search');
    if (query !== null) {
      setSearchQuery(query);
    }
  }, [location.search]);

  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: fetchAllJobs,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: savedJobs = [] } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: () => savedJobsApi.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async (job: Job): Promise<SaveMutationResult> => {
      const existing = savedJobs.find(s => s.url === job.url);
      if (existing) {
        await savedJobsApi.delete(existing.id);
        return { action: 'removed', job };
      } else {
        await savedJobsApi.create({
          job_title: job.title,
          company: job.company,
          category: job.category,
          city: job.city,
          url: job.url,
          level: job.level,
          size: job.size,
          job_category: job.job_category
        });
        return { action: 'saved', job };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      toast.success(result.action === 'saved' ? 'Job saved!' : 'Job removed from saved');
      // Track in PostHog
      posthog.capture(result.action === 'saved' ? 'job_saved' : 'job_unsaved', {
        job_title: result.job.title,
        company: result.job.company,
        category: result.job.category,
        city: result.job.city,
        level: result.job.level,
      });
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (job: Job): Promise<ApplyMutationResult> => {
      const existing = savedJobs.find(s => s.url === job.url);
      if (existing) {
        await savedJobsApi.update(existing.id, {
          applied: !existing.applied,
          applied_date: !existing.applied ? new Date().toISOString().split('T')[0] : undefined
        });
        return { action: existing.applied ? 'unapplied' : 'applied', job };
      } else {
        await savedJobsApi.create({
          job_title: job.title,
          company: job.company,
          category: job.category,
          city: job.city,
          url: job.url,
          level: job.level,
          size: job.size,
          job_category: job.job_category,
          applied: true,
          applied_date: new Date().toISOString().split('T')[0]
        });
        return { action: 'applied', job };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      toast.success(result.action === 'applied' ? 'Marked as applied!' : 'Unmarked as applied');
      // Track in PostHog
      posthog.capture(result.action === 'applied' ? 'job_applied' : 'job_unapplied', {
        job_title: result.job.title,
        company: result.job.company,
        category: result.job.category,
        city: result.job.city,
        level: result.job.level,
      });
    },
  });

  // Extract unique cities from jobs
  const cities = useMemo(() => {
    const citySet = new Set(jobs.map(job => job.city).filter(Boolean));
    return Array.from(citySet).sort();
  }, [jobs]);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesSearch =
          job.title?.toLowerCase().includes(search) ||
          job.company?.toLowerCase().includes(search) ||
          job.category?.toLowerCase().includes(search) ||
          job.city?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(job.category)) {
        return false;
      }

      // Job category filter
      if (filters.jobCategories.length > 0 && !filters.jobCategories.includes(job.job_category)) {
        return false;
      }

      // Level filter
      if (filters.levels.length > 0) {
        const titleLower = job.title?.toLowerCase() || '';
        const jobLevel = job.level?.toLowerCase() || '';

        const matchesLevel = filters.levels.some(level => {
          const levelLower = level.toLowerCase();
          if (levelLower === 'junior') {
            return titleLower.includes('junior') || titleLower.includes('jr.') || titleLower.includes('jr ');
          }
          if (levelLower === 'mid-level') {
            return !titleLower.includes('senior') && !titleLower.includes('junior') && !titleLower.includes('lead') && !titleLower.includes('staff') && !titleLower.includes('principal') && !titleLower.includes('director') && !titleLower.includes('head of') && !titleLower.includes('vp');
          }
          if (levelLower === 'senior') {
            return titleLower.includes('senior') || titleLower.includes('sr.') || titleLower.includes('sr ');
          }
          if (levelLower === 'staff') {
            return titleLower.includes('staff') || titleLower.includes('principal');
          }
          if (levelLower === 'lead') {
            return titleLower.includes('lead') && !titleLower.includes('team lead');
          }
          if (levelLower === 'team lead') {
            return titleLower.includes('team lead') || titleLower.includes('tl ') || titleLower.includes('tech lead');
          }
          if (levelLower === 'manager') {
            return jobLevel === 'manager' || titleLower.includes('manager');
          }
          if (levelLower === 'director') {
            return titleLower.includes('director');
          }
          if (levelLower === 'executive') {
            return jobLevel === 'executive' || titleLower.includes('head of') || titleLower.includes('vp') || titleLower.includes('cto') || titleLower.includes('ceo') || titleLower.includes('chief');
          }
          if (levelLower === 'intern') {
            return titleLower.includes('intern') || titleLower.includes('student');
          }
          return false;
        });

        if (!matchesLevel) return false;
      }

      // Size filter
      if (filters.sizes.length > 0 && !filters.sizes.includes(job.size)) {
        return false;
      }

      // City filter
      if (filters.cities.length > 0 && !filters.cities.includes(job.city)) {
        return false;
      }

      return true;
    });
  }, [jobs, filters, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  // Track search in PostHog (debounced, only on query change)
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        posthog.capture('job_search', {
          query: searchQuery,
          results_count: filteredJobs.length,
        });
      }, 1000); // Debounce 1 second
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]); // Only trigger on query change, not results count

  // Scroll to top when page changes
  useEffect(() => {
    document.querySelector('.flex-1.overflow-y-auto')?.scrollTo(0, 0);
  }, [currentPage]);

  const activeFiltersCount =
    filters.categories.length +
    filters.jobCategories.length +
    filters.levels.length +
    filters.sizes.length +
    filters.cities.length;

  const isJobSaved = (job: Job) => savedJobs.some(s => s.url === job.url);
  const isJobApplied = (job: Job) => savedJobs.some(s => s.url === job.url && s.applied);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-iris-50/30">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-iris-700 via-iris-800 to-iris-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur">
                  <Briefcase className="w-8 h-8" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">Israeli Tech Jobs</h1>
              </div>
              <p className="text-lg text-iris-100 max-w-2xl">
                Discover opportunities at Israel's top tech companies.
                Updated daily from leading startups and enterprises.
              </p>
            </div>
            <Button asChild className="bg-copper-500 text-white hover:bg-copper-600 border-none shadow-lg">
              <Link to={createPageUrl("Companies")}>
                <Building2 className="w-4 h-4 mr-2" />
                Browse Companies
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-200px)]">
        {/* Sidebar */}
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          cities={cities}
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          isMobile={true}
        />
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          cities={cities}
          isOpen={true}
          onClose={() => {}}
          isMobile={false}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <SearchHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onFilterClick={() => setIsFilterOpen(true)}
            totalJobs={filteredJobs.length}
            activeFiltersCount={activeFiltersCount}
          />

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <JobsLoader />
            ) : paginatedJobs.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="w-16 h-16 text-warm-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-warm-700 mb-2">No jobs found</h3>
                <p className="text-warm-500">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-w-4xl">
                  {paginatedJobs.map((job, index) => (
                    <JobCard
                      key={`${job.url}-${index}`}
                      job={job}
                      index={index}
                      onSave={(job) => saveMutation.mutate(job)}
                      isSaved={isJobSaved(job)}
                      onApply={(job) => applyMutation.mutate(job)}
                      isApplied={isJobApplied(job)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={currentPage === pageNum ? "bg-iris-600" : ""}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
