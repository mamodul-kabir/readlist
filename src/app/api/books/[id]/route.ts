import { NextRequest, NextResponse } from 'next/server';
import db, { Book } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { validateBookPayload } from '@/lib/validation';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateCheck = checkRateLimit(req, 'api-books-put', 30, 60 * 1000);
  if (!rateCheck.success) return rateCheck.response!;

  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const bookId = Number(resolvedParams.id);
    const existingBook = await db.get<Book>('SELECT * FROM books WHERE id = ? AND user_id = ?', [bookId, currentUser.id]);

    if (!existingBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const body = await req.json();
    if (body.title !== undefined) {
      const validation = validateBookPayload(body);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    const {
      title,
      authors,
      cover_url,
      google_search_url,
      status,
      start_date,
      finish_date,
      year: explicitYear,
      review,
      is_hidden
    } = body;

    const targetStatus = status || existingBook.status;
    if (!['currently_reading', 'read', 'unfinished'].includes(targetStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // CHECK CONTINUOUSLY READING LIMIT (MAX 4)
    if (targetStatus === 'currently_reading' && existingBook.status !== 'currently_reading') {
      const currentReadingCount = await db.get<{ count: number }>(
        "SELECT COUNT(*) as count FROM books WHERE user_id = ? AND status = 'currently_reading' AND id != ?",
        [currentUser.id, bookId]
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
    let finalYear: number | null = existingBook.year;
    if (explicitYear !== undefined) {
      if (explicitYear === null || explicitYear === '') {
        finalYear = null;
      } else if (!isNaN(Number(explicitYear))) {
        finalYear = Number(explicitYear);
      }
    } else if (finish_date) {
      const parsedYear = new Date(finish_date).getFullYear();
      if (!isNaN(parsedYear)) {
        finalYear = parsedYear;
      } else {
        const yearMatch = String(finish_date).match(/\b(19|20)\d{2}\b/);
        if (yearMatch) finalYear = parseInt(yearMatch[0], 10);
      }
    }

    const finalTitle = title !== undefined ? title.trim() : existingBook.title;
    const finalAuthors = authors !== undefined ? (authors ? authors.trim() : null) : existingBook.authors;
    const finalSearchUrl = google_search_url !== undefined ? google_search_url : existingBook.google_search_url;
    const finalCoverUrl = cover_url !== undefined ? cover_url : existingBook.cover_url;
    const finalStartDate = start_date !== undefined ? start_date : existingBook.start_date;
    const finalFinishDate = finish_date !== undefined ? finish_date : existingBook.finish_date;
    const finalReview = review !== undefined ? (review ? String(review).trim() : null) : existingBook.review;
    const finalIsHidden = is_hidden !== undefined ? (is_hidden ? 1 : 0) : existingBook.is_hidden;

    await db.run(`
      UPDATE books SET
        title = ?,
        authors = ?,
        cover_url = ?,
        google_search_url = ?,
        status = ?,
        start_date = ?,
        finish_date = ?,
        year = ?,
        review = ?,
        is_hidden = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, [
      finalTitle,
      finalAuthors,
      finalCoverUrl,
      finalSearchUrl,
      targetStatus,
      finalStartDate,
      finalFinishDate,
      finalYear,
      finalReview,
      finalIsHidden,
      bookId,
      currentUser.id
    ]);

    const updatedBook = await db.get<Book>('SELECT * FROM books WHERE id = ?', [bookId]);

    return NextResponse.json({ book: updatedBook });
  } catch (error: any) {
    console.error('Update book error:', error);
    return NextResponse.json({ error: 'Failed to update book.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateCheck = checkRateLimit(req, 'api-books-delete', 30, 60 * 1000);
  if (!rateCheck.success) return rateCheck.response!;

  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const bookId = Number(resolvedParams.id);
    const result = await db.run('DELETE FROM books WHERE id = ? AND user_id = ?', [bookId, currentUser.id]);

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete book error:', error);
    return NextResponse.json({ error: 'Failed to delete book.' }, { status: 500 });
  }
}
