'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  tag: string;
  name: string;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--surface)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px'
      }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          fontSize: '1.1rem',
          letterSpacing: '-0.02em'
        }}>
          <span className="font-serif" style={{ fontSize: '1.3rem', fontStyle: 'italic', fontWeight: 600 }}>ReadList</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!loading && (
            <>
              {user ? (
                <>
                  <Link href={`/@${user.tag}`} className="btn btn-secondary btn-sm" title="View Public Profile">
                    <span>@{user.tag}</span>
                  </Link>
                  <Link href="/dashboard" className="btn btn-primary btn-sm">
                    Dashboard
                  </Link>
                  <Link href="/settings" className="btn btn-secondary btn-sm" title="Settings">
                    ⚙️
                  </Link>
                  <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-secondary btn-sm">
                    Sign In
                  </Link>
                  <Link href="/signup" className="btn btn-primary btn-sm">
                    Create Profile
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
