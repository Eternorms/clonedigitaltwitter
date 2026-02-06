import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const response = await fetch('https://trends.google.com/trending/rss?geo=BR', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AgencyOS/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ trends: [] });
    }

    const xml = await response.text();

    // Parse <item><title>...</title></item> tags
    const titleRegex = /<item>[\s\S]*?<title>([^<]+)<\/title>/g;
    const trends: string[] = [];
    let match;

    while ((match = titleRegex.exec(xml)) !== null) {
      if (trends.length >= 15) break;
      const title = match[1].trim();
      if (title && !title.includes('CDATA')) {
        trends.push(title);
      }
    }

    return NextResponse.json({ trends });
  } catch (error) {
    console.error('Failed to fetch Google Trends:', error);
    return NextResponse.json({ trends: [] });
  }
}
