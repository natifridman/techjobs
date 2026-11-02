-- Run before deploying the company profile website links.
-- Preserve existing company metadata and avoid updates when the URL is unchanged.
INSERT INTO companies (name, website_url)
VALUES ('Elbit Systems', 'https://www.elbitsystems.com/')
ON CONFLICT (name) DO UPDATE
SET website_url = EXCLUDED.website_url
WHERE companies.website_url IS DISTINCT FROM EXCLUDED.website_url;
