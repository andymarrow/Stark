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
          '/trending',
          '/about',
          '/blog',
          '/project/',
          '/profile/',
          '/contests',
          '/contests/',
          '/events/',
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
          '/create',
          '/chat',
          '/api/',
          '/events/*/dashboard',
          '/contests/*/dashboard',
          '/contests/*/judge',
          '/project/*/edit',
          '/blog/write',
          '/blog/studio',
          '/profile/report',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl.replace(/^https?:\/\//, ''),
  };
}
