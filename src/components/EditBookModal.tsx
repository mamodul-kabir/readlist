'use client';

import { useState, useEffect } from 'react';
import { Book } from '@/lib/db';

interface EditBookModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentReadingCount: number;
}

export default function EditBookModal({ book, isOpen, onClose, onSuccess, currentReadingCount }: EditBookModalProps) {
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [googleSearchUrl, setGoogleSearchUrl] = useState('');
  const [status, setStatus] = useState<'currently_reading' | 'read' | 'unfinished'>('read');
  const [startDate, setStartDate] = useState('');
  const [finishDate, setFinishDate] = useState('');
  const [year, setYear] = useState('');
  const [review, setReview] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book) {
      setTitle(book.title || '');
      setAuthors(book.authors || '');
      setCoverUrl(book.cover_url || '');
      setGoogleSearchUrl(book.google_search_url || '');
      setStatus(book.status);
      setStartDate(book.start_date || '');
      setFinishDate(book.finish_date || '');
      setYear(book.year ? String(book.year) : '');
      setReview(book.review || '');
      setIsHidden(Boolean(book.is_hidden));
      setError('');
    }
  }, [book]);

  if (!isOpen || !book) return null;

  const wordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    // If changing status to currently_reading and was not currently_reading before
    if (status === 'currently_reading' && book.status !== 'currently_reading' && currentReadingCount >= 4) {
      setError('Maximum limit reached! You can only have up to 4 books in your "Currently Reading" section at a time.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        authors: authors.trim() || null,
        cover_url: coverUrl || null,
        google_search_url: googleSearchUrl || `https://www.google.com/search?q=${encodeURIComponent(title)}`,
        status,
        start_date: startDate || null,
        finish_date: finishDate || null,
        year: year ? parseInt(year, 10) : null,
        review: review.trim() || null,
        is_hidden: isHidden ? 1 : 0
      };

      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update book');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-serif" style={{ fontSize: '1.3rem' }}>Edit Book</h2>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Title *</label>
            <input
              type="text"
              className="input-control"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Author(s)</label>
            <input
              type="text"
              className="input-control"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Status Section</label>
            <select
              className="input-control"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="currently_reading">Currently Reading (Max 4 books)</option>
              <option value="read">Read / Finished</option>
              <option value="unfinished">Unfinished / Misc</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Start Date</label>
              <input
                type="date"
                className="input-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Finish Date</label>
              <input
                type="date"
                className="input-control"
                value={finishDate}
                onChange={(e) => setFinishDate(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Year</label>
              <input
                type="number"
                className="input-control"
                placeholder="e.g. 2026"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="input-label">Review (Up to 250 words)</label>
              <span style={{ fontSize: '0.75rem', color: wordCount(review) > 250 ? 'var(--danger)' : 'var(--text-muted)' }}>
                {wordCount(review)} / 250 words
              </span>
            </div>
            <textarea
              className="input-control"
              rows={4}
              value={review}
              onChange={(e) => {
                const text = e.target.value;
                if (wordCount(text) <= 250 || text.length < review.length) {
                  setReview(text);
                }
              }}
            />
          </div>

          {/* Privacy Toggle Option */}
          <div className="input-group" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={isHidden}
                onChange={(e) => setIsHidden(e.target.checked)}
                style={{ accentColor: 'var(--text-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>🔒 Hide this book from public profile (Keep Private)</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
