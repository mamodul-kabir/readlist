'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tag, setTag] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !tag || !name) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tag, name })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed.');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-narrow" style={{ paddingTop: '3.5rem' }}>
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <h1 className="font-serif" style={{ fontSize: '1.8rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          Create your Reading List
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
          Get a personal reading showcase URL like <code style={{ backgroundColor: 'var(--accent-light)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>/@yourtag</code>
        </p>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input
              type="text"
              className="input-control"
              placeholder="e.g. Alex Morgan"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email Address (Used for Login)</label>
            <input
              type="email"
              className="input-control"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Unique User Tag (Used in profile URL)</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{
                padding: '0.6rem 0.8rem',
                backgroundColor: 'var(--accent-light)',
                border: '1px solid var(--border)',
                borderRight: 'none',
                borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)'
              }}>@</span>
              <input
                type="text"
                className="input-control"
                style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}
                placeholder="alex"
                required
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Your profile URL will be <code style={{ backgroundColor: 'var(--accent-light)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>/@{tag || 'yourtag'}</code>
            </p>
          </div>

          <div className="input-group">
            <label className="input-label">Password (Min 6 chars)</label>
            <input
              type="password"
              className="input-control"
              placeholder="••••••••"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', fontSize: '0.95rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <Link href="/login" style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'underline' }}>
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
