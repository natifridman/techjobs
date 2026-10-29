export function jobsContinuationUrl(): string {
  const url = new URL(window.location.href);
  url.hash = 'continue-jobs';
  return url.toString();
}
