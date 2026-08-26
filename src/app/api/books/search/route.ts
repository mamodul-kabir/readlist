import { NextRequest, NextResponse } from 'next/server';
import { searchGoogleBooks } from '@/lib/googleBooks';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  // Rate limit: Max 20 book searches per minute per IP
  const rateCheck = checkRateLimit(req, 'books-search', 20, 60 * 1000);
  if (!rateCheck.success) {
    return rateCheck.response!;
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ items: [] });
  }

  if (q.length > 100) {
    return NextResponse.json({ items: [] });
  }

  const items = await searchGoogleBooks(q);
  return NextResponse.json({ items });
}
