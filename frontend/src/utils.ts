// Page URL mapping for navigation
const pageRoutes: Record<string, string> = {
  Home: '/',
  Jobs: '/jobs',
  Companies: '/companies',
  CompanyProfile: '/company',
  SavedJobs: '/saved',
  Map: '/map',
};

export function createPageUrl(pageName: string): string {
  return pageRoutes[pageName] || '/';
}
