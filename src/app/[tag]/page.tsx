'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Book } from '@/lib/db';
import BookCard from '@/components/BookCard';

interface ProfilePageProps {
  params: Promise<{ tag: string }>;
}

export default function UserProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = use(params);
  const rawTag = resolvedParams.tag;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<{
    isPrivate: boolean;
    isOwner: boolean;
    user: { id?: number; tag: string; name: string; is_private: number; created_at?: string };
    books: Book[];
  } | null>(null);

  useEffect(() => {
    fetch(`/api/user/profile/${encodeURIComponent(rawTag)}`)
      .then((res) => {
        if (!res.ok && res.status === 404) {
          throw new Error('User profile not found.');
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProfile(data);
      })
      .catch((err) => {
        setError(err.message || 'Could not load profile');
      })
      .finally(() => setLoading(false));
  }, [rawTag]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading reader profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container-narrow" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '3rem 2rem'
        }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🔍</span>
          <h2 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Profile Not Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            No registered reader found for tag <code style={{ backgroundColor: 'var(--accent-light)', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>{rawTag}</code>.
          </p>
          <Link href="/" className="btn btn-primary btn-sm">
            ← Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Handle Private Profile
  if (profile.isPrivate) {
    return (
      <div className="container-narrow" style={{ paddingTop: '4rem' }}>
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>🔒</span>
          <h1 className="font-serif" style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
            {profile.user.name}'s Reading List is Private
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            This account owner (@{profile.user.tag}) has set their reading list to private.
          </p>
          <Link href="/login" className="btn btn-secondary btn-sm">
            Sign In if this is your account
          </Link>
        </div>
      </div>
    );
  }

  const { user, books, isOwner } = profile;

  // Separate books into sections
  const currentlyReading = books.filter((b) => b.status === 'currently_reading');
  const readBooks = books.filter((b) => b.status === 'read');
  const unfinishedBooks = books.filter((b) => b.status === 'unfinished');

  // Group read books by year
  const readBooksByYear: { [year: string]: Book[] } = {};
  const undatedReadBooks: Book[] = [];

  readBooks.forEach((book) => {
    if (book.year) {
      const yr = String(book.year);
      if (!readBooksByYear[yr]) readBooksByYear[yr] = [];
      readBooksByYear[yr].push(book);
    } else if (book.finish_date) {
      const match = book.finish_date.match(/\b(19|20)\d{2}\b/);
      if (match) {
        const yr = match[0];
        if (!readBooksByYear[yr]) readBooksByYear[yr] = [];
        readBooksByYear[yr].push(book);
      } else {
        undatedReadBooks.push(book);
      }
    } else {
      undatedReadBooks.push(book);
    }
  });

  // Sort years in descending order (e.g., 2026, 2025, 2024...)
  const sortedYears = Object.keys(readBooksByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      {/* Profile Header */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '2rem',
        marginBottom: '2.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
              {user.name}
            </h1>
            <span className="badge badge-reading" style={{ fontSize: '0.85rem' }}>
              @{user.tag}
            </span>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Reading Log & Collection • {books.filter(b => b.status === 'read').length} books read
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isOwner && (
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              Manage Books (Dashboard)
            </Link>
          )}

          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Profile link copied to clipboard!');
            }}
            className="btn btn-secondary btn-sm"
          >
            📋 Share Link
          </button>
        </div>
      </div>

      {/* 1. TOP SECTION: Currently Reading Books */}
      {currentlyReading.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            paddingBottom: '0.5rem',
            borderBottom: '2px solid var(--border)'
          }}>
            <h2 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📖 Currently Reading</span>
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {currentlyReading.length} of 4 max
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            {currentlyReading.map((book) => (
              <BookCard key={book.id} book={book} isOwner={isOwner} />
            ))}
          </div>
        </section>
      )}

      {/* 2. MAIN SECTION: Read Books Arranged by Year */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{
          marginBottom: '1.5rem',
          paddingBottom: '0.5rem',
          borderBottom: '2px solid var(--border)'
        }}>
          <h2 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            Read Books by Year
          </h2>
        </div>

        {sortedYears.length === 0 && undatedReadBooks.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
            No read books logged yet.
          </p>
        ) : (
          sortedYears.map((yearStr) => {
            const yearBooks = readBooksByYear[yearStr];
            return (
              <div key={yearStr} style={{ marginBottom: '2.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <h3 className="font-serif" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {yearStr}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    ({yearBooks.length} {yearBooks.length === 1 ? 'book' : 'books'})
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1.25rem'
                }}>
                  {yearBooks.map((book) => (
                    <BookCard key={book.id} book={book} isOwner={isOwner} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* 3. SECTION: Undated / Misc Read Books */}
      {undatedReadBooks.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <div style={{
            marginBottom: '1.25rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid var(--border)'
          }}>
            <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Undated / Miscellaneous Read Books ({undatedReadBooks.length})
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            {undatedReadBooks.map((book) => (
              <BookCard key={book.id} book={book} isOwner={isOwner} />
            ))}
          </div>
        </section>
      )}

      {/* 4. SECTION: Unfinished / Partially Read Books */}
      {unfinishedBooks.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <div style={{
            marginBottom: '1.25rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid var(--border)'
          }}>
            <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Unfinished / Partially Read ({unfinishedBooks.length})
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            {unfinishedBooks.map((book) => (
              <BookCard key={book.id} book={book} isOwner={isOwner} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
