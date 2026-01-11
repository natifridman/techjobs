import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Bookmark, BookmarkCheck, ExternalLink, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { usePostHog } from 'posthog-js/react';
import CompanyLogo from "@/components/CompanyLogo";
import type { Job } from "./jobsData";

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
      <Card className="group bg-white hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-slate-200 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4">
                <CompanyLogo name={job.company} className="w-12 h-12 hidden sm:flex" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={`${levelColors[job.level] || 'bg-slate-50 text-slate-700 border-slate-200'} text-xs font-medium`}
                    >
                      {job.level}
                    </Badge>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                      {job.job_category}
                    </Badge>
                    {isSaved && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 gap-1 pl-1.5">
                        <BookmarkCheck className="w-3 h-3" />
                        Saved
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-lg text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors truncate">
                    {job.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-slate-600 mb-3">
                    <span className="font-medium">{job.company}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm text-slate-500">{job.category}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{job.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{sizeLabels[job.size] || job.size} employees</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSave(job)}
                className={`rounded-full ${isSaved ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600'}`}
              >
                {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </Button>
              {onApply && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onApply(job)}
                  className={`rounded-full ${isApplied ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600'}`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              Updated: {new Date(job.updated).toLocaleDateString('en-US')}
            </span>
            <div className="flex items-center gap-2">
              <Button 
                asChild 
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
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
