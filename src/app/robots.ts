import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://rolacards.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/perfil', '/cliente/', '/mis-inscripciones'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
