import { NextRequest, NextResponse } from 'next/server';
import db, { User, Book } from '@/lib/db';
import { getAuthenticatedUser, normalizeTag } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  const rateCheck = checkRateLimit(req, 'user-profile', 60, 60 * 1000);
  if (!rateCheck.success) return rateCheck.response!;
  try {
    const resolvedParams = await params;
    const rawTag = resolvedParams.tag;
    const cleanTag = normalizeTag(rawTag);

    const user = await db.get<User>('SELECT id, email, tag, name, is_private, created_at FROM users WHERE tag = ?', [cleanTag]);

    if (!user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const currentUser = await getAuthenticatedUser(req);
    const isOwner = currentUser ? currentUser.id === user.id : false;

    if (user.is_private === 1 && !isOwner) {
      return NextResponse.json({
        isPrivate: true,
        isOwner: false,
        user: {
          tag: user.tag,
          name: user.name,
          is_private: 1
        },
        books: []
      });
    }

    const allBooks = await db.all<Book>('SELECT * FROM books WHERE user_id = ? ORDER BY created_at DESC', [user.id]);

    let finalBooks = allBooks;
    if (!isOwner) {
      finalBooks = [];
      for (const b of allBooks) {
        if (b.is_hidden === 1) {
          if (b.status === 'currently_reading') {
            // Mask hidden currently reading book as 'book-hidden'
            finalBooks.push({
              ...b,
              title: 'book-hidden',
              authors: null,
              cover_url: null,
              google_search_url: '#',
              google_books_id: null,
              review: null,
            });
          }
          // If status is 'read' or 'unfinished', exclude completely from list
        } else {
          finalBooks.push(b);
        }
      }
    }

    return NextResponse.json({
      isPrivate: false,
      isOwner,
      user: {
        id: user.id,
        tag: user.tag,
        name: user.name,
        is_private: user.is_private,
        created_at: user.created_at
      },
      books: finalBooks
    });
  } catch (error: any) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
