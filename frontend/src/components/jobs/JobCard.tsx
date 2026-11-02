import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  CheckCircle2,
  Briefcase,
  ChevronDown,
} from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import CompanyLogo from '@/components/CompanyLogo';
import { locationLabel } from '@/lib/locations';
import { displayCity, isClosed, isNewToday, CATEGORY_LABELS, type Job } from './jobsData';

interface JobCardProps {
  job: Job;
  onSave: (job: Job) => void;
  isSaved: boolean;
  onApply?: (job: Job) => void;
  isApplied?: boolean;
  isSaving?: boolean;
  isUpdating?: boolean;
  index?: number;
}
export default function JobCard({
  job,
  onSave,
  isSaved,
  onApply,
  isApplied,
  isSaving,
  isUpdating,
}: JobCardProps) {
  const posthog = usePostHog();
  const [expanded, setExpanded] = useState(false);
  const city = displayCity(job);
  const closed = isClosed(job);
  const rawDate = job.postedAt || job.updated;
  const validDate = rawDate && Number.isFinite(Date.parse(rawDate)) ? rawDate : null;
  const metadata = [
    job.workModel?.replace(/-/g, ' '),
    job.employmentType?.replace(/-/g, ' '),
    job.seniority,
  ].filter(Boolean);
  return (
    <article
      aria-label={`${job.title} at ${job.company}`}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-iris-200 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <CompanyLogo name={job.company} className="h-10 w-10 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-base font-semibold leading-6 text-ink sm:text-lg" dir="auto">
            {job.title}
          </h3>
          <Link
            to={`/company?name=${encodeURIComponent(job.company)}`}
            className="mt-1 inline-block text-sm font-medium text-muted hover:text-primary hover:underline"
          >
            <bdi>{job.company}</bdi>
          </Link>
        </div>
        {isNewToday(job) && !closed && (
          <span className="shrink-0 rounded-full bg-success-bg px-2 py-1 text-xs font-semibold text-success">
            New
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
        {city && (
          <span className="inline-flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <bdi aria-label={`Location: ${city}`}>
              {city}
              {!expanded && job.cities.length > 1 ? ` +${job.cities.length - 1}` : ''}
            </bdi>
          </span>
        )}
        {!!metadata.length && (
          <span className="inline-flex items-start gap-1.5 capitalize">
            <Briefcase className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {metadata.join(' · ')}
          </span>
        )}
      </div>
      {expanded && job.cities.length > 1 && (
        <p className="mt-2 text-sm text-muted" aria-label="All locations">
          {job.cities.map((city) => (
            <bdi key={city} className="mr-3 inline-block">
              {locationLabel(city, city === job.city ? job.cityHe || '' : '')}
            </bdi>
          ))}
        </p>
      )}
      <div className="mb-4 mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-iris-50 px-2 py-1 text-xs font-medium text-primary">
          {CATEGORY_LABELS[job.job_category] || job.job_category.replace(/-/g, ' ')}
        </span>
        {closed && <span className="rounded-md bg-warm-100 px-2 py-1 text-xs text-muted">Closed</span>}
        {(expanded ? job.technologies : job.technologies.slice(0, 3)).map((tech) => (
          <span key={tech} className="rounded-md bg-page px-2 py-1 text-xs text-muted">
            {tech}
          </span>
        ))}
      </div>
      {(job.cities.length > 1 || job.technologies.length > 3) && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="mb-3 inline-flex min-h-11 items-center gap-1 self-start text-xs font-medium text-primary"
        >
          {expanded
            ? 'Show less'
            : `Show ${job.technologies.length > 3 ? `${job.technologies.length - 3} more skills${job.cities.length > 1 ? ' and locations' : ''}` : 'all locations'}`}
          <ChevronDown className={`h-3.5 w-3.5 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      )}
      <div className="mt-auto border-t border-border pt-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          {validDate ? (
            <time className="text-xs text-muted" dateTime={validDate}>
              {job.postedAt ? 'Posted' : 'Updated'}{' '}
              {new Date(validDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                timeZone: 'Asia/Jerusalem',
              })}
            </time>
          ) : (
            <span />
          )}
          {onApply && (
            <button
              type="button"
              onClick={() => onApply(job)}
              disabled={isUpdating}
              aria-pressed={!!isApplied}
              aria-label={isApplied ? `Unmark ${job.title} as applied` : `Mark ${job.title} as applied`}
              className={`inline-flex min-h-9 items-center gap-1.5 text-xs disabled:opacity-50 ${isApplied ? 'text-success' : 'text-muted hover:text-primary'}`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {isApplied ? 'Applied' : 'Mark applied'}
            </button>
          )}
        </div>
        <div className="flex items-center justify-between gap-2" role="group" aria-label="Job actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSave(job)}
            disabled={isSaving}
            aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
            aria-pressed={isSaved}
            className={`gap-1.5 px-2.5 ${isSaved ? 'bg-iris-50 text-primary' : ''}`}
          >
            {isSaved ? (
              <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Bookmark className="h-4 w-4" aria-hidden="true" />
            )}
            {isSaving ? 'Saving…' : isSaved ? 'Saved' : 'Save'}
          </Button>
          {closed ? (
            <Button size="sm" disabled aria-label={`Applications closed for ${job.title}`}>
              Applications closed
            </Button>
          ) : (
            <Button asChild size="sm" className="gap-1.5">
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Apply to ${job.title} at ${job.company} (opens in new window)`}
                onClick={() =>
                  posthog.capture('job_apply_clicked', {
                    job_title: job.title,
                    company: job.company,
                    job_category: job.job_category,
                    city: job.city,
                    seniority: job.seniority,
                    url: job.url,
                    source_page: window.location.pathname,
                  })
                }
              >
                Apply
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
