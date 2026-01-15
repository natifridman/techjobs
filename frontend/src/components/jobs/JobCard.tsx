import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Bookmark, BookmarkCheck, ExternalLink, CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePostHog } from 'posthog-js/react';
import { useState } from "react";
import CompanyLogo from "@/components/CompanyLogo";
import type { Job } from "./jobsData";
import { jobPreviewApi } from "@/api/storage";

const sizeLabels: Record<string, string> = {
  'xs': '1-10',
  's': '11-50',
  'm': '51-200',
  'l': '201-1,000',
  'xl': '1,001+'
};

const levelColors: Record<string, string> = {
  'Engineer': 'bg-blue-50 text-blue-700 border-blue-200',
  'Manager': 'bg-purple-50 text-purple-700 border-purple-200',
  'Executive': 'bg-amber-50 text-amber-700 border-amber-200',
  'Intern': 'bg-green-50 text-green-700 border-green-200',
};

interface JobCardProps {
  job: Job;
  onSave: (job: Job) => void;
  isSaved: boolean;
  onApply?: (job: Job) => void;
  isApplied?: boolean;
  index?: number;
}

export default function JobCard({ job, onSave, isSaved, onApply, isApplied, index = 0 }: JobCardProps) {
  const posthog = usePostHog();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewDescription, setPreviewDescription] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handleTogglePreview = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    setIsExpanded(true);

    // If we already have the description, don't fetch again
    if (previewDescription) return;

    setIsLoadingPreview(true);
    setPreviewError(null);

    const result = await jobPreviewApi.getDescription(job.url);

    if (result.error) {
      setPreviewError(result.error);
    } else {
      setPreviewDescription(result.description);
    }

    setIsLoadingPreview(false);
  };

  const handleApplyClick = () => {
    posthog.capture('job_apply_clicked', {
      job_title: job.title,
      company: job.company,
      category: job.category,
      city: job.city,
      level: job.level,
      url: job.url,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card 
        role="article"
        aria-label={`${job.title} at ${job.company}`}
        className="group bg-white hover:shadow-xl transition-all duration-300 border border-warm-100 hover:border-warm-200 overflow-hidden rounded-xl card-hover"
      >
        <CardContent className="p-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4">
                <CompanyLogo name={job.company} className="w-12 h-12 hidden sm:flex" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`${levelColors[job.level] || 'bg-warm-50 text-warm-700 border-warm-200'} text-xs font-medium`}
                    >
                      {job.level}
                    </Badge>
                    <Badge variant="outline" className="bg-iris-50 text-iris-700 border-iris-200 text-xs">
                      {job.job_category}
                    </Badge>
                    {isSaved && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1 pl-1.5">
                        <BookmarkCheck className="w-3 h-3" aria-hidden="true" />
                        Saved
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-semibold text-lg text-warm-900 mb-1 group-hover:text-iris-600 transition-colors truncate">
                    {job.title}
                  </h3>

                  <div className="flex items-center gap-2 text-warm-600 mb-3">
                    <span className="font-medium">{job.company}</span>
                    <span className="text-warm-300">•</span>
                    <span className="text-sm text-warm-500">{job.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-warm-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-warm-400" aria-hidden="true" />
                  <span aria-label={`Location: ${job.city}`}>{job.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-warm-400" aria-hidden="true" />
                  <span aria-label={`Company size: ${sizeLabels[job.size] || job.size} employees`}>{sizeLabels[job.size] || job.size} employees</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2" role="group" aria-label="Job actions">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSave(job)}
                aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
                aria-pressed={isSaved}
                className={`rounded-full ${isSaved ? 'text-iris-600 bg-iris-50' : 'text-warm-400 hover:text-iris-600'}`}
              >
                {isSaved ? <BookmarkCheck className="w-5 h-5" aria-hidden="true" /> : <Bookmark className="w-5 h-5" aria-hidden="true" />}
              </Button>
              {onApply && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onApply(job)}
                  aria-label={isApplied ? `Unmark ${job.title} as applied` : `Mark ${job.title} as applied`}
                  aria-pressed={isApplied}
                  className={`rounded-full ${isApplied ? 'text-emerald-600 bg-emerald-50' : 'text-warm-400 hover:text-emerald-600'}`}
                >
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-warm-100 flex justify-between items-center">
            <time className="text-xs text-warm-400" dateTime={job.updated}>
              Updated: {new Date(job.updated).toLocaleDateString('en-US')}
            </time>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePreview}
                className="gap-1.5 text-warm-600 hover:text-iris-600 border-warm-200"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Hide job description preview" : "Show job description preview"}
              >
                {isLoadingPreview ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : isExpanded ? (
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                )}
                Preview
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-copper-500 hover:bg-copper-600 text-white gap-2 rounded-lg"
                onClick={handleApplyClick}
              >
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Apply to ${job.title} at ${job.company} (opens in new window)`}
                >
                  Apply Now
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-warm-100">
                  {isLoadingPreview ? (
                    <div className="flex items-center justify-center py-8 text-warm-400">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span>Loading description...</span>
                    </div>
                  ) : previewError ? (
                    <div className="py-4 text-center text-warm-500">
                      <p className="text-sm">{previewError}</p>
                      <p className="text-xs mt-1">Click "Apply Now" to view the full job posting</p>
                    </div>
                  ) : previewDescription ? (
                    <div className="prose prose-sm prose-warm max-w-none">
                      <div className="text-sm text-warm-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                        {previewDescription}
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
