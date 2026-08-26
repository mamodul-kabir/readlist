'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [tagInput, setTagInput] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleSearchProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    let clean = tagInput.trim();
    if (!clean.startsWith('@')) clean = `@${clean}`;
    router.push(`/${clean}`);
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
        <span className="badge badge-reading" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
          📖 Minimalist Reading List & Tracker
        </span>

        <h1 className="font-serif" style={{
          fontSize: '3rem',
          fontWeight: 600,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '1.25rem',
          color: 'var(--text-primary)'
        }}>
          Curate your personal reading journey over the years.
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '2.5rem'
        }}>
          Keep track of what you are reading, organize your finished books by year, write concise 250-word reviews, and share your personal reading list page at <code style={{ backgroundColor: 'var(--accent-light)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>/@yourtag</code>.
        </p>

        {user ? (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              Go to Your Dashboard →
            </Link>
            <Link href={`/@${user.tag}`} className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              View Profile (@{user.tag})
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
            <Link href="/signup" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              Create Your Reading List
            </Link>
            <Link href="/login" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              Sign In
            </Link>
          </div>
        )}

        {/* Quick Profile Lookup Form */}
        <div style={{
          marginTop: '3.5rem',
          padding: '2rem',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 className="font-serif" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            Explore a Reader's Public List
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Enter a user tag to view their annual reading log (e.g., <code style={{ backgroundColor: 'var(--accent-light)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>@alex</code> or <code style={{ backgroundColor: 'var(--accent-light)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>alex</code>).
          </p>

          <form onSubmit={handleSearchProfile} style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px', margin: '0 auto' }}>
            <input
              type="text"
              className="input-control"
              placeholder="@usertag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary">
              Visit Profile ↗
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
