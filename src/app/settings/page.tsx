'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push('/login');
          return;
        }
        setUser(data.user);
        setName(data.user.name);
        setIsPrivate(Boolean(data.user.is_private));
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          is_private: isPrivate ? 1 : 0,
          password: newPassword ? newPassword : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setUser(data.user);
      setNewPassword('');
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-narrow" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="container-narrow" style={{ paddingTop: '3rem' }}>
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h1 className="font-serif" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          Account Settings
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Manage your profile details and privacy preferences
        </p>

        {message && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem'
          }}>
            {message.type === 'success' ? '✓' : '⚠️'} {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Display Name</label>
            <input
              type="text"
              className="input-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">User Tag (Permanent)</label>
            <input
              type="text"
              className="input-control"
              value={`@${user.tag}`}
              disabled
              style={{ backgroundColor: 'var(--surface-hover)', cursor: 'not-allowed' }}
            />
          </div>

          {/* Privacy Toggle */}
          <div style={{
            margin: '1.5rem 0',
            padding: '1.25rem',
            backgroundColor: 'var(--accent-light)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                  🔒 Private Profile
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  When enabled, only you can view your reading list at <code style={{ backgroundColor: 'var(--surface)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>/@{user.tag}</code>.
                </p>
              </div>

              <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: isPrivate ? 'var(--accent)' : 'var(--border)',
                  borderRadius: '26px',
                  transition: '0.2s'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '20px',
                    width: '20px',
                    left: isPrivate ? '24px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.2s'
                  }} />
                </span>
              </label>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">New Password (Optional)</label>
            <input
              type="password"
              className="input-control"
              placeholder="Leave blank to keep current password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
