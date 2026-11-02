import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Bookmark, BookmarkCheck, ExternalLink, CheckCircle2, Briefcase } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import CompanyLogo from '@/components/CompanyLogo';
import { createPageUrl } from '@/utils';
import { displayCity, isClosed, isNewToday, CATEGORY_LABELS, type Job } from './jobsData';

interface JobCardProps {
  job: Job;
  onSave: (job: Job) => void;
  isSaved: boolean;
  onApply?: (job: Job) => void;
  isApplied?: boolean;
  index?: number;
}

export default function JobCard({ job, onSave, isSaved, onApply, isApplied }: JobCardProps) {
  const posthog = usePostHog();
  const city = displayCity(job);
  const closed = isClosed(job);
  const trackApply = () => posthog.capture('job_apply_clicked', {
    job_title: job.title, company: job.company, job_category: job.job_category,
    city: job.city, seniority: job.seniority, url: job.url,
  });
  const metadata = [job.workModel?.replace(/-/g, ' '), job.employmentType?.replace(/-/g, ' '), job.seniority].filter(Boolean);
  return (
    <article aria-label={`${job.title} at ${job.company}`} className="rounded-xl border border-warm-200 bg-surface p-4 sm:p-5 transition-colors hover:border-iris-200">
      <div className="flex items-start gap-3">
        <CompanyLogo name={job.company} className="hidden h-10 w-10 shrink-0 sm:flex" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-base font-semibold leading-6 text-warm-900 sm:text-lg">{job.title}</h3>
          <Link to={`${createPageUrl('CompanyProfile')}?name=${encodeURIComponent(job.company)}`} className="mt-0.5 inline-block text-sm font-medium text-warm-600 hover:text-iris-700 hover:underline">{job.company}</Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-iris-700">{CATEGORY_LABELS[job.job_category] || job.job_category.replace(/-/g, ' ')}</span>
            {closed ? <span className="rounded bg-warm-100 px-1.5 py-0.5 text-warm-600">Closed</span> : isNewToday(job) && <span className="rounded bg-success-bg px-1.5 py-0.5 font-medium text-success">New</span>}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-warm-500">
        {city && <span className="inline-flex items-center gap-1.5" aria-label={`Location: ${city}`}><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{city}{job.cities.length > 1 ? ` +${job.cities.length - 1}` : ''}</span>}
        {metadata.length > 0 && <span className="inline-flex items-center gap-1.5 capitalize"><Briefcase className="h-3.5 w-3.5" aria-hidden="true" />{metadata.join(' · ')}</span>}
      </div>
      {job.technologies.length > 0 && <div className="mt-2.5 flex flex-wrap items-center gap-1.5" aria-label="Technologies">
        {job.technologies.slice(0, 3).map(tech => <span key={tech} className="rounded-md bg-warm-50 px-2 py-0.5 text-xs text-warm-600">{tech}</span>)}
        {job.technologies.length > 3 && <span className="text-xs text-warm-400">+{job.technologies.length - 3}</span>}
      </div>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-warm-100 pt-3">
        {job.updated ? <time className="text-xs text-warm-400" dateTime={job.updated}>{job.postedAt ? 'Posted' : 'Updated'} {new Date(job.updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time> : <span />}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Job actions">
          <Button variant="ghost" size="sm" onClick={() => onSave(job)} aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`} aria-pressed={isSaved} className={`gap-1.5 px-2.5 text-xs ${isSaved ? 'bg-iris-50 text-iris-700' : 'text-warm-600'}`}>
            {isSaved ? <BookmarkCheck className="h-4 w-4" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />}{isSaved ? 'Saved' : 'Save'}
          </Button>
          {onApply && <Button variant="ghost" size="sm" onClick={() => onApply(job)} aria-label={isApplied ? `Unmark ${job.title} as applied` : `Mark ${job.title} as applied`} aria-pressed={!!isApplied} className={`gap-1.5 px-2.5 text-xs ${isApplied ? 'bg-success-bg text-success hover:bg-success-bg hover:text-success' : 'text-warm-600'}`}><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{isApplied ? 'Applied' : 'Mark applied'}</Button>}
          {closed ? <Button size="sm" disabled className="text-xs" aria-label={`Applications closed for ${job.title}`}>Apply</Button> : <Button asChild size="sm" className="gap-1.5 bg-action text-xs text-action-foreground hover:bg-action-hover" onClick={trackApply}><a href={job.url} target="_blank" rel="noopener noreferrer" aria-label={`Apply to ${job.title} at ${job.company} (opens in new window)`}>Apply<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a></Button>}
        </div>
      </div>
    </article>
  );
}
