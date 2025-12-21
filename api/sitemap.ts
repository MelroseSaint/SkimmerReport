import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getReports } from '../src/services/serverless.js';
import type { Report } from '../src/domain/types.js';


const SITE_URL = 'https://skimmer-report.vercel.app';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Fetch all reports to determine active cities
    // In a real DB scenario, we would use a distinct query: SELECT DISTINCT city, state FROM reports
    const response = await getReports({});
    const _reports: Report[] = JSON.parse(response.body);

    // 2. Extract unique locations (Mocking city/state derivation since Report only has lat/lon)
    // In production, Report would have city/state fields or we'd reverse geocode.
    // We will create a set of unique "state/city" strings.
    const cities = new Set<string>();

    // Add some static/seed cities for demonstration since DB is ephemeral
    cities.add('illinois/chicago');
    cities.add('new-york/new-york');
    cities.add('california/los-angeles');
    cities.add('texas/austin');

    // reports.forEach(r => {
    //     // Mock derivation: if we had city/state in report
    //     // const slug = `${slugify(r.state)}/${slugify(r.city)}`;
    //     // cities.add(slug);
    // });

    // 3. Build XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/transparency</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Dynamic City Pages -->
  ${Array.from(cities).map(slug => `
  <url>
    <loc>${SITE_URL}/locations/${slug}</loc>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  `).join('')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).end();
  }
}
