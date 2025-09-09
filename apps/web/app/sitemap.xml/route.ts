import { getServerSideSitemap } from 'next-sitemap';

import appConfig from '~/config/app.config';
import { getAllBlogPosts } from '~/lib/blog';

/**
 * @description The maximum age of the sitemap in seconds.
 * This is used to set the cache-control header for the sitemap. The cache-control header is used to control how long the sitemap is cached.
 * By default, the cache-control header is set to 'public, max-age=600, s-maxage=3600'.
 * This means that the sitemap will be cached for 600 seconds (10 minutes) and will be considered stale after 3600 seconds (1 hour).
 */
const MAX_AGE = 60;
const S_MAX_AGE = 3600;

export async function GET() {
  const paths = getPaths();

  const headers = {
    'Cache-Control': `public, max-age=${MAX_AGE}, s-maxage=${S_MAX_AGE}`,
  };

  return getServerSideSitemap([...paths], headers);
}

function getPaths() {
  const staticPaths = [
    '/',
    '/blog',
    '/pricing',
    '/faq',
    '/cookie-policy',
    '/terms-of-service',
    '/privacy-policy',
    // add more paths here
  ];

  // Get all blog posts
  const blogPosts = getAllBlogPosts();
  const blogPaths = blogPosts.map(post => `/blog/${post.slug}`);

  // Combine static paths and blog paths
  const allPaths = [...staticPaths, ...blogPaths];

  return allPaths.map((path) => {
    // For blog posts, use their actual date; for others use current date
    const isBlogPost = path.startsWith('/blog/') && path !== '/blog';
    const lastmod = isBlogPost 
      ? blogPosts.find(post => path === `/blog/${post.slug}`)?.date || new Date().toISOString().split('T')[0]
      : new Date().toISOString();

    return {
      loc: new URL(path, appConfig.url).href,
      lastmod: lastmod,
      // Add changefreq and priority for better SEO
      changefreq: isBlogPost ? 'weekly' : 'monthly',
      priority: path === '/' ? 1.0 : (path === '/blog' ? 0.9 : (isBlogPost ? 0.8 : 0.7)),
    };
  });
}
