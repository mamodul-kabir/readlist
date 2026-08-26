import { NextRequest, NextResponse } from 'next/server';
import db, { Book } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { validateBookPayload } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const rateCheck = checkRateLimit(req, 'api-books-get', 60, 60 * 1000);
  if (!rateCheck.success) return rateCheck.response!;

  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const books = await db.all<Book>('SELECT * FROM books WHERE user_id = ? ORDER BY created_at DESC', [currentUser.id]);
  return NextResponse.json({ books });
}

export async function POST(req: NextRequest) {
  const rateCheck = checkRateLimit(req, 'api-books-post', 30, 60 * 1000);
  if (!rateCheck.success) return rateCheck.response!;

  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = validateBookPayload(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      title,
      authors,
      cover_url,
      google_search_url,
      google_books_id,
      status,
      start_date,
      finish_date,
      year: explicitYear,
      review,
      is_hidden
    } = body;

    const bookStatus = status || 'read';
    if (!['currently_reading', 'read', 'unfinished'].includes(bookStatus)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    // CHECK CONTINUOUSLY READING LIMIT (MAX 4)
    if (bookStatus === 'currently_reading') {
      const currentReadingCount = await db.get<{ count: number }>(
        "SELECT COUNT(*) as count FROM books WHERE user_id = ? AND status = 'currently_reading'",
        [currentUser.id]
      );

      if (currentReadingCount && currentReadingCount.count >= 4) {
        return NextResponse.json(
          {
            error: 'Maximum limit reached! You can only have up to 4 books in your "Currently Reading" section at a time. Please finish, move, or remove one of your current books first.'
          },
          { status: 400 }
        );
      }
    }

    // Compute year
    let finalYear: number | null = null;
    if (explicitYear && !isNaN(Number(explicitYear))) {
      finalYear = Number(explicitYear);
    } else if (finish_date) {
      const parsedYear = new Date(finish_date).getFullYear();
      if (!isNaN(parsedYear)) {
        finalYear = parsedYear;
      } else {
        // Maybe finish_date is a 4-digit string like "2026"
        const yearMatch = String(finish_date).match(/\b(19|20)\d{2}\b/);
        if (yearMatch) finalYear = parseInt(yearMatch[0], 10);
      }
    }

    // Generate Google Search URL if missing
    let finalSearchUrl = google_search_url;
    if (!finalSearchUrl || !finalSearchUrl.trim()) {
      const queryStr = `${title.trim()} ${authors ? authors.trim() : ''}`.trim();
      finalSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(queryStr)}`;
    }

    // Clean review text
    let cleanReview = review ? String(review).trim() : null;
    const isHiddenVal = is_hidden ? 1 : 0;

    const result = await db.run(`
      INSERT INTO books (
        user_id, title, authors, cover_url, google_search_url, google_books_id,
        status, start_date, finish_date, year, review, is_hidden
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      currentUser.id,
      title.trim(),
      authors ? authors.trim() : null,
      cover_url || null,
      finalSearchUrl,
      google_books_id || null,
      bookStatus,
      start_date || null,
      finish_date || null,
      finalYear,
      cleanReview,
      isHiddenVal
    ]);

    const insertedBook = await db.get<Book>('SELECT * FROM books WHERE id = ?', [Number(result.lastInsertRowid)]);

    return NextResponse.json({ book: insertedBook }, { status: 201 });
  } catch (error: any) {
    console.error('Create book error:', error);
    return NextResponse.json({ error: 'Failed to add book.' }, { status: 500 });
  }
}
