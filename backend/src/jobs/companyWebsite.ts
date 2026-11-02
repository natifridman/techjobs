import { getDomain } from 'tldts';
import homepageOverrides from './companyHomepages.json';

// These domains host many employers. Their root is never the employer's homepage.
const SHARED_DOMAINS = new Set([
  'applytojob.com', 'ashbyhq.com', 'avature.net', 'bamboohr.com', 'breezy.hr', 'careers-page.com', 'comeet.com', 'comeet.co',
  'drushim.co.il', 'eightfold.ai', 'gem.com', 'github.io', 'greenhouse.io', 'homerun.co', 'icims.com', 'jobvite.com',
  'join.com', 'lever.co', 'linkedin.com', 'myworkdayjobs.com', 'notion.site', 'oraclecloud.com',
  'personio.com', 'personio.de', 'pinpointhq.com', 'recruiterbox.com', 'recruitee.com', 'smartrecruiters.com', 'successfactors.com',
  'taleo.net', 'team8.vc', 'teamme.link', 'teamtailor.com', 'trakstar.com', 'webflow.io',
  'wixsite.com', 'workable.com',
]);

export function companyWebsite(name: string, jobUrl: string): string | null {
  // Hosted hiring boards need a verified company homepage; do not guess from a slug.
  if (Object.hasOwn(homepageOverrides, name)) {
    return (homepageOverrides as Record<string, string | null>)[name];
  }
  try {
    const url = new URL(jobUrl);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    const domain = getDomain(url.hostname);
    if (!domain || SHARED_DOMAINS.has(domain)) return null;
    // Public suffix parsing retains company.co.il, while removing jobs/careers subdomains.
    const hostname = url.hostname === `www.${domain}` ? url.hostname : domain;
    return `${url.protocol}//${hostname}/`;
  } catch {
    return null;
  }
}
