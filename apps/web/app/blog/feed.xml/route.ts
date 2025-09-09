import { getAllBlogPosts } from '~/lib/blog';
import appConfig from '~/config/app.config';

export async function GET() {
  const posts = getAllBlogPosts();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Neuroleaf Learning Blog</title>
    <description>Evidence-based study techniques, AI-powered learning strategies, and educational insights to supercharge your learning journey.</description>
    <link>${appConfig.url}/blog</link>
    <atom:link href="${appConfig.url}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <ttl>60</ttl>
    <image>
      <title>Neuroleaf Learning Blog</title>
      <url>${appConfig.url}/favicon.ico</url>
      <link>${appConfig.url}/blog</link>
    </image>
    ${posts
      .slice(0, 20) // Limit to 20 most recent posts
      .map((post) => {
        const postUrl = `${appConfig.url}/blog/${post.slug}`;
        const pubDate = new Date(post.date).toUTCString();
        
        return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt}]]></description>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>noreply@neuroleaf.ai (${post.author})</author>
      <category><![CDATA[${post.category}]]></category>
      ${post.tags.map(tag => `<category><![CDATA[${tag}]]></category>`).join('\n      ')}
    </item>`.trim();
      })
      .join('\n    ')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=7200', // Cache for 1-2 hours
    },
  });
}