import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  LogIn,
  Bookmark,
  BookmarkX,
  MapPin,
  Building2,
  ExternalLink,
  Briefcase,
  CheckCircle2,
  Circle,
  MessageSquare,
  Pencil,
  RefreshCw,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { reconcileGuestSavedJobs, savedJobsApi, type SavedJob } from "@/api/storage";
import { useAuth } from "@/hooks/useAuth";
import { useSavedJobs } from '@/hooks/useSavedJobs';

type FilterType = 'all' | 'applied' | 'not-applied';

export default function SavedJobs() {
  const queryClient = useQueryClient();
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: savedJobs = [], isLoading } = useSavedJobs();

  // Pending guest records (failed reconciliation uploads) stay visible in
  // the list; retry the sync whenever this page is opened signed in.
  const { isAuthenticated, login } = useAuth();
  useEffect(() => {
    if (!isAuthenticated) return;
    reconcileGuestSavedJobs().finally(() => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    });
  }, [isAuthenticated, queryClient]);

  const pendingCount = savedJobs.filter(j => j.pending).length;
  const retrySync = useMutation({
    mutationFn: () => reconcileGuestSavedJobs(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedJobs'] }),
  });

  const filteredJobs = savedJobs.filter(job => {
    if (filter === 'applied') return job.applied;
    if (filter === 'not-applied') return !job.applied;
    return true;
  });

  const appliedCount = savedJobs.filter(j => j.applied).length;

  const deleteMutation = useMutation({
    mutationFn: ({ id, url }: { id: string; url?: string }) => savedJobsApi.delete(id, url),
    onSuccess: (removed) => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      // delete() resolves false when nothing was actually removed or queued
      // (e.g. the account could not be resolved to scope a retry) - that is
      // a failure, not a removal.
      if (removed) {
        toast.success('Job removed from saved');
      } else {
        toast.error('Failed to remove job');
      }
    },
    onError: () => {
      toast.error('Failed to remove job');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, url }: { id: string; data: Partial<SavedJob>; url?: string }) =>
      savedJobsApi.update(id, data, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    },
    onError: () => {
      toast.error('Failed to update job');
    },
  });

  const toggleApplied = (job: SavedJob) => {
    const newApplied = !job.applied;
    updateMutation.mutate({
      id: job.id,
      data: {
        applied: newApplied,
        applied_date: newApplied ? new Date().toISOString().split('T')[0] : undefined
      },
      url: job.url
    }, {
      onSuccess: () => {
        toast.success(newApplied ? 'Marked as applied!' : 'Unmarked as applied');
      }
    });
  };

  const startEditingComment = (job: SavedJob) => {
    setEditingComment(job.id);
    setCommentText(job.comments || '');
  };

  const saveComment = (job: SavedJob) => {
    const text = commentText;
    setEditingComment(null);
    setCommentText('');
    updateMutation.mutate({
      id: job.id,
      data: { comments: text },
      url: job.url
    }, {
      onSuccess: () => {
        toast.success('Comment saved');
      }
    });
  };

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <div className="bg-surface border-b border-warm-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="ghost" size="icon">
              <Link to={createPageUrl("Jobs")} aria-label="Back to jobs">
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-iris-100 rounded-lg">
                <Bookmark className="w-6 h-6 text-iris-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-warm-900">Saved Jobs</h1>
                <p className="text-warm-500">{savedJobs.length} jobs saved • {appliedCount} applied</p>
              </div>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="mt-5 flex flex-col gap-4 rounded-xl border border-iris-100 bg-iris-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-sm font-semibold text-ink">Saved on this browser</h2><p className="mt-1 text-sm text-muted">Guest bookmarks and notes stay on this device. Sign in to sync them to your account and access them elsewhere.</p></div>
              <Button onClick={() => login(window.location.href)} className="shrink-0"><LogIn className="mr-2 h-4 w-4" aria-hidden="true" />Sign in to sync</Button>
            </div>
          )}

          {isAuthenticated && pendingCount > 0 && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-warning-border bg-warning-bg px-4 py-3" role="status">
              <p className="text-sm text-warning">
                {pendingCount} saved {pendingCount === 1 ? 'job has' : 'jobs have'} not synced to your account yet.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => retrySync.mutate()}
                disabled={retrySync.isPending}
                className="gap-1.5"
              >
                <RefreshCw className={`w-4 h-4 ${retrySync.isPending ? 'animate-spin' : ''}`} />
                Retry sync
              </Button>
            </div>
          )}

          {/* Filter Tabs */}
          {savedJobs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4" role="group" aria-label="Filter saved jobs">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-action hover:bg-action-hover text-action-foreground' : ''}
                aria-pressed={filter === 'all'}
              >
                All ({savedJobs.length})
              </Button>
              <Button
                variant={filter === 'applied' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('applied')}
                className={filter === 'applied' ? 'bg-action hover:bg-action-hover text-action-foreground' : ''}
                aria-pressed={filter === 'applied'}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Applied ({appliedCount})
              </Button>
              <Button
                variant={filter === 'not-applied' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('not-applied')}
                className={filter === 'not-applied' ? 'bg-action hover:bg-action-hover text-action-foreground' : ''}
                aria-pressed={filter === 'not-applied'}
              >
                <Circle className="w-4 h-4 mr-1.5" />
                Not Applied ({savedJobs.length - appliedCount})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-warm-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-warm-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredJobs.length === 0 && savedJobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 text-warm-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-warm-700 mb-2">No saved jobs yet</h3>
            <p className="text-warm-500 mb-6">
              Browse jobs and click the bookmark icon to save them here
            </p>
            <Button asChild className="bg-action hover:bg-action-hover text-action-foreground">
              <Link to={createPageUrl("Jobs")}>
                Browse Jobs
              </Link>
            </Button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-16 h-16 text-warm-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-warm-700 mb-2">
              {filter === 'applied' ? 'No applied jobs yet' : 'All jobs have been applied to!'}
            </h3>
            <p className="text-warm-500 mb-6">
              {filter === 'applied'
                ? 'Mark jobs as applied when you submit your application'
                : 'Great job! You\'ve applied to all your saved positions'}
            </p>
            <Button onClick={() => setFilter('all')} variant="outline">
              View All Jobs
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                >
                  <Card className="bg-surface hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {job.pending && (
                              <Badge variant="outline" className="bg-warning-bg text-warning border-warning-border text-xs">
                                Not synced yet
                              </Badge>
                            )}
                            {job.level && (
                              <Badge
                                variant="outline"
                                className="bg-warm-50 text-warm-700 border-warm-200 text-xs capitalize"
                              >
                                {job.level}
                              </Badge>
                            )}
                            {job.job_category && (
                              <Badge variant="outline" className="bg-iris-50 text-iris-700 border-iris-200 text-xs capitalize">
                                {job.job_category.replace(/-/g, ' ')}
                              </Badge>
                            )}
                            {job.applied && (
                              <Badge className="bg-success-bg text-success border-success-border hover:bg-success-bg gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Applied {job.applied_date && `• ${format(new Date(job.applied_date), 'MMM d')}`}
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-lg text-warm-900 mb-2 break-words" dir="auto">
                            {job.job_title}
                          </h3>

                          <div className="flex items-center gap-2 text-warm-600 mb-2">
                            <Building2 className="w-4 h-4 text-warm-400" />
                            <span className="font-medium">{job.company}</span>
                            {job.category && (
                              <>
                                <span className="text-warm-300">•</span>
                                <span className="text-sm text-warm-500">{job.category}</span>
                              </>
                            )}
                          </div>

                          {job.city && (
                            <div className="flex items-center gap-1.5 text-sm text-warm-500">
                              <MapPin className="w-4 h-4 text-warm-400" />
                              <span>{job.city}</span>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate({ id: job.id, url: job.url })}
                          disabled={deleteMutation.isPending}
                          className="text-muted hover:text-danger hover:bg-danger-bg disabled:opacity-50"
                          aria-label={`Remove ${job.job_title} from saved jobs`}
                        >
                          <BookmarkX className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* Comments Section */}
                      {editingComment === job.id ? (
                        <div className="mt-4 space-y-2">
                          <Textarea
                            placeholder="Add notes about this application..."
                            aria-label={`Note for ${job.job_title}`}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="min-h-20"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingComment(null);
                                setCommentText('');
                              }}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveComment(job)}
                              disabled={updateMutation.isPending}
                              className="bg-action hover:bg-action-hover text-action-foreground disabled:opacity-50"
                            >
                              {updateMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      ) : job.comments ? (
                        <div className="mt-4 p-3 bg-warm-50 rounded-lg">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 text-sm text-warm-600">
                              <MessageSquare className="w-4 h-4 text-warm-400 mt-0.5 shrink-0" />
                              <p className="whitespace-pre-wrap">{job.comments}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted hover:text-ink"
                              aria-label={`Edit note for ${job.job_title}`}
                              onClick={() => startEditingComment(job)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-4 pt-4 border-t border-warm-100 flex flex-wrap gap-3 justify-between items-center">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleApplied(job)}
                            disabled={updateMutation.isPending}
                            className={`${job.applied ? 'text-success border-success-border hover:bg-success-bg hover:text-success' : ''} disabled:opacity-50`}
                          >
                            {job.applied ? (
                              <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            ) : (
                              <Circle className="w-4 h-4 mr-1.5" />
                            )}
                            {job.applied ? 'Applied' : 'Mark Applied'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditingComment(job)}
                            className="gap-1.5"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {job.comments ? 'Edit Note' : 'Add Note'}
                          </Button>
                        </div>
                        <Button
                          asChild
                          size="sm"
                          className="bg-action hover:bg-action-hover text-action-foreground gap-2"
                        >
                          <a href={job.url} target="_blank" rel="noopener noreferrer">
                            Apply Now
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
