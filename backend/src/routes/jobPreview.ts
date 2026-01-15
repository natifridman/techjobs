import { Router, Request, Response } from 'express';

const router = Router();

// Simple in-memory cache for job descriptions
const descriptionCache = new Map<string, { description: string; fetchedAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Clean old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of descriptionCache.entries()) {
    if (now - value.fetchedAt > CACHE_TTL) {
      descriptionCache.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean every hour

interface ParseResult {
  description: string;
  platform: string;
}

// Parser for Comeet job pages
function parseComeet(html: string): string | null {
  // Comeet stores job data in POSITION_DATA JavaScript variable
  const positionDataMatch = html.match(/POSITION_DATA\s*=\s*(\{[\s\S]*?\});?\s*(?:var|const|let|COMPANY_DATA)/);
  if (positionDataMatch) {
    try {
      // Clean up the JSON - it might have trailing commas or other issues
      let jsonStr = positionDataMatch[1];
      // Try to parse directly first
      const data = JSON.parse(jsonStr);

      if (data.custom_fields?.details) {
        const details = data.custom_fields.details;
        const descriptionParts: string[] = [];

        for (const field of details) {
          if (field.name && field.value) {
            descriptionParts.push(`**${field.name}**\n${stripHtml(field.value)}`);
          }
        }

        if (descriptionParts.length > 0) {
          return descriptionParts.join('\n\n');
        }
      }

      // Fallback to description field
      if (data.description) {
        return stripHtml(data.description);
      }
    } catch {
      // JSON parse failed, try regex extraction
      const descMatch = html.match(/"description"\s*:\s*"([^"]+)"/);
      if (descMatch) {
        return stripHtml(descMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'));
      }
    }
  }

  // Try to find description in meta tags
  const metaMatch = html.match(/<meta\s+(?:name|property)="(?:og:)?description"\s+content="([^"]+)"/i);
  if (metaMatch) {
    return metaMatch[1];
  }

  return null;
}

// Parser for Lever job pages
function parseLever(html: string): string | null {
  // Lever uses specific div classes for content
  const contentMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
  if (contentMatch && contentMatch.length > 0) {
    return stripHtml(contentMatch.slice(0, 3).join('\n'));
  }

  // Try section with posting-categories
  const sectionMatch = html.match(/<div[^>]*class="[^"]*section[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
  if (sectionMatch) {
    return stripHtml(sectionMatch.slice(0, 5).join('\n'));
  }

  return null;
}

// Parser for Greenhouse job pages
function parseGreenhouse(html: string): string | null {
  // Greenhouse uses #content or .content for job description
  const contentMatch = html.match(/<div[^>]*id="content"[^>]*>([\s\S]*?)<\/div>/i);
  if (contentMatch) {
    return stripHtml(contentMatch[1]);
  }

  // Try app_body class
  const appBodyMatch = html.match(/<div[^>]*id="app_body"[^>]*>([\s\S]*?)<\/div>/i);
  if (appBodyMatch) {
    return stripHtml(appBodyMatch[1]);
  }

  return null;
}

// Parser for LinkedIn job pages
function parseLinkedIn(html: string): string | null {
  // LinkedIn jobs have description in specific div
  const descMatch = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (descMatch) {
    return stripHtml(descMatch[1]);
  }

  // Try meta description
  const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if (metaMatch) {
    return metaMatch[1];
  }

  return null;
}

// Generic parser - tries to extract meaningful content
function parseGeneric(html: string): string | null {
  // Try common patterns for job descriptions
  const patterns = [
    /<div[^>]*class="[^"]*(?:job-description|jobDescription|description|job-details|jobDetails)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*(?:description|details|content)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const text = stripHtml(match[1]);
      if (text.length > 100) {
        return text;
      }
    }
  }

  // Try meta description as last resort
  const metaMatch = html.match(/<meta\s+(?:name|property)="(?:og:)?description"\s+content="([^"]+)"/i);
  if (metaMatch && metaMatch[1].length > 50) {
    return metaMatch[1];
  }

  return null;
}

// Strip HTML tags and clean up text
function stripHtml(html: string): string {
  return html
    // Replace <br>, <p>, <div>, <li> with newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    // Remove all other HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
    // Limit length
    .substring(0, 3000);
}

// Detect platform from URL
function detectPlatform(url: string): string {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('comeet.com')) return 'comeet';
  if (urlLower.includes('lever.co')) return 'lever';
  if (urlLower.includes('greenhouse.io')) return 'greenhouse';
  if (urlLower.includes('linkedin.com')) return 'linkedin';
  return 'generic';
}

// Fetch and parse job description
async function fetchJobDescription(url: string): Promise<ParseResult> {
  const platform = detectPlatform(url);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch job page: ${response.status}`);
  }

  const html = await response.text();

  let description: string | null = null;

  // Try platform-specific parser first
  switch (platform) {
    case 'comeet':
      description = parseComeet(html);
      break;
    case 'lever':
      description = parseLever(html);
      break;
    case 'greenhouse':
      description = parseGreenhouse(html);
      break;
    case 'linkedin':
      description = parseLinkedIn(html);
      break;
  }

  // Fall back to generic parser
  if (!description) {
    description = parseGeneric(html);
  }

  if (!description) {
    throw new Error('Could not extract job description from page');
  }

  return { description, platform };
}

// GET /api/job-preview?url=...
router.get('/', async (req: Request, res: Response) => {
  const url = req.query.url as string;

  if (!url) {
    res.status(400).json({ error: 'URL parameter is required' });
    return;
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  // Check cache
  const cached = descriptionCache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    res.json({ description: cached.description, cached: true });
    return;
  }

  try {
    const result = await fetchJobDescription(url);

    // Cache the result
    descriptionCache.set(url, {
      description: result.description,
      fetchedAt: Date.now(),
    });

    res.json({
      description: result.description,
      platform: result.platform,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching job description:', error);
    res.status(500).json({
      error: 'Failed to fetch job description',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
