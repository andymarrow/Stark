/**
 * Dynamic robots.txt for Stark (stark.et).
 * Points crawlers to the sitemap and disallows auth/admin paths.
 */
function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://stark.et';
}

export default function robots() {
  const baseUrl = getBaseUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/explore',
          '/project/',
          '/profile/',
          '/contests',
          '/contests/',
          '/trending',
          '/about',
          '/legal/',
        ],
        disallow: [
          '/admin',
          '/admin/',
          '/login',
          '/onboarding',
          '/forgot-password',
          '/update-password',
          '/dashboard',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl.replace(/^https?:\/\//, ''),
  };
}
