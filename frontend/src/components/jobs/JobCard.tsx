import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Bookmark, BookmarkCheck, ExternalLink, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { usePostHog } from 'posthog-js/react';
import CompanyLogo from "@/components/CompanyLogo";
import type { Job } from "./jobsData";
import { applicationsApi } from "@/api/storage";

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

  const handleApplyClick = () => {
    // Track in PostHog
    posthog.capture('job_apply_clicked', {
      job_title: job.title,
      company: job.company,
      category: job.category,
      city: job.city,
      level: job.level,
      url: job.url,
    });
    
    // Track application click in Supabase
    applicationsApi.track({
      job_title: job.title,
      company: job.company,
      category: job.category,
      city: job.city,
      url: job.url,
      level: job.level,
      size: job.size,
      job_category: job.job_category
    });
    
    // Also mark as applied in saved jobs if not already
    if (onApply && !isApplied) {
      onApply(job);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group bg-white hover:shadow-xl transition-all duration-300 border border-warm-100 hover:border-warm-200 overflow-hidden rounded-xl card-hover">
        <CardContent className="p-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4">
                <CompanyLogo name={job.company} className="w-12 h-12 hidden sm:flex" />
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
                        <BookmarkCheck className="w-3 h-3" />
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
                  <MapPin className="w-4 h-4 text-warm-400" />
                  <span>{job.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-warm-400" />
                  <span>{sizeLabels[job.size] || job.size} employees</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSave(job)}
                aria-label={isSaved ? "Remove from saved jobs" : "Save job"}
                className={`rounded-full ${isSaved ? 'text-iris-600 bg-iris-50' : 'text-warm-400 hover:text-iris-600'}`}
              >
                {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </Button>
              {onApply && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onApply(job)}
                  aria-label={isApplied ? "Unmark as applied" : "Mark as applied"}
                  className={`rounded-full ${isApplied ? 'text-emerald-600 bg-emerald-50' : 'text-warm-400 hover:text-emerald-600'}`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-warm-100 flex justify-between items-center">
            <span className="text-xs text-warm-400">
              Updated: {new Date(job.updated).toLocaleDateString('en-US')}
            </span>
            <div className="flex items-center gap-2">
              <Button
                asChild
                size="sm"
                className="bg-copper-500 hover:bg-copper-600 text-white gap-2 rounded-lg"
                onClick={handleApplyClick}
              >
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  Apply Now
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
