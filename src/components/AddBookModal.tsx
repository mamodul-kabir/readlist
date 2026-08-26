'use client';

import { useState, useEffect } from 'react';
import { GoogleBookSearchResult } from '@/lib/googleBooks';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentReadingCount: number;
}

export default function AddBookModal({ isOpen, onClose, onSuccess, currentReadingCount }: AddBookModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<GoogleBookSearchResult | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [googleSearchUrl, setGoogleSearchUrl] = useState('');
  const [status, setStatus] = useState<'currently_reading' | 'read' | 'unfinished'>('currently_reading');
  const [startDate, setStartDate] = useState('');
  const [finishDate, setFinishDate] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [review, setReview] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearching(false);
    setSelectedBook(null);
    setTitle('');
    setAuthors('');
    setCoverUrl('');
    setGoogleSearchUrl('');
    setStatus('currently_reading');
    setStartDate('');
    setFinishDate('');
    setYear(new Date().getFullYear().toString());
    setReview('');
    setIsHidden(false);
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Debounced search with abort controller
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.items || []);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err);
        }
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  if (!isOpen) return null;

  const selectSearchResult = (item: GoogleBookSearchResult) => {
    setSelectedBook(item);
    setTitle(item.title);
    setAuthors(item.authors.join(', '));
    setCoverUrl(item.coverUrl || '');
    setGoogleSearchUrl(item.googleSearchUrl);
    setSearchResults([]);
  };

  const wordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a book title.');
      return;
    }

    // CHECK 4 BOOK CONTINUOUSLY READING LIMIT
    if (status === 'currently_reading' && currentReadingCount >= 4) {
      setError('Maximum limit reached! You can only have up to 4 books in your "Currently Reading" section at a time. Please finish, move, or remove one of your current books first.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        authors: authors.trim() || null,
        cover_url: coverUrl || null,
        google_search_url: googleSearchUrl || `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + authors)}`,
        google_books_id: selectedBook?.id || null,
        status,
        start_date: startDate || null,
        finish_date: status === 'read' ? (finishDate || null) : null,
        year: status === 'read' && year ? parseInt(year, 10) : null,
        review: review.trim() || null,
        is_hidden: isHidden ? 1 : 0
      };

      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add book.');
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-serif" style={{ fontSize: '1.3rem' }}>Add a Book</h2>
          <button onClick={handleClose} className="btn-icon">✕</button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            lineHeight: 1.4
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Live Search Section */}
        <div className="input-group">
          <label className="input-label">🔍 Search Book by Title (Google Books API)</label>
          <input
            type="text"
            className="input-control"
            placeholder="Type book title, e.g., '1984', 'Dune', 'The Great Gatsby'..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searching && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Searching Google Books API...</p>}

          {searchResults.length > 0 && (
            <div style={{
              maxHeight: '220px',
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface)',
              marginTop: '0.5rem',
              boxShadow: 'var(--shadow-md)'
            }}>
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => selectSearchResult(item)}
                  style={{
                    padding: '0.6rem 0.8rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'background 0.1s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {item.coverUrl ? (
                    <img src={item.coverUrl} alt={item.title} style={{ width: '32px', height: '48px', objectFit: 'cover', borderRadius: '3px' }} />
                  ) : (
                    <div style={{ width: '32px', height: '48px', backgroundColor: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>📖</div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{item.title}</p>
                    {item.authors.length > 0 && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>by {item.authors.join(', ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Book Preview */}
        {selectedBook && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 0.8rem',
            backgroundColor: 'var(--accent-light)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem'
          }}>
            {selectedBook.coverUrl && <img src={selectedBook.coverUrl} alt="" style={{ width: '30px', height: '45px', objectFit: 'cover' }} />}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Selected: {selectedBook.title}</p>
              <a href={selectedBook.googleSearchUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Google Search Link ↗
              </a>
            </div>
            <button onClick={() => setSelectedBook(null)} className="btn-icon">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Manual Title and Author */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
                placeholder="Author name"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
              />
            </div>
          </div>

          {/* Reading Status Selection */}
          <div className="input-group">
            <label className="input-label">Status Section *</label>
            <select
              className="input-control"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="currently_reading">Currently Reading (Max 4 books, currently: {currentReadingCount}/4)</option>
              <option value="read">Read / Finished</option>
              <option value="unfinished">Unfinished / Misc</option>
            </select>

            {status === 'currently_reading' && currentReadingCount >= 4 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.35rem' }}>
                ⚠️ Warning: Your Currently Reading section is full (4/4). You cannot add another currently reading book until you complete or remove one.
              </p>
            )}
          </div>

          {/* Dates & Year */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {status === 'currently_reading' && (
              <div className="input-group">
                <label className="input-label">Start Date (Optional)</label>
                <input
                  type="date"
                  className="input-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            )}

            {status === 'read' && (
              <>
                <div className="input-group">
                  <label className="input-label">Completion Year</label>
                  <input
                    type="number"
                    className="input-control"
                    placeholder="e.g. 2026"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Specific Date (Optional)</label>
                  <input
                    type="date"
                    className="input-control"
                    value={finishDate}
                    onChange={(e) => setFinishDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Optional Review */}
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="input-label">Optional Review</label>
              <span style={{ fontSize: '0.75rem', color: wordCount(review) > 250 ? 'var(--danger)' : 'var(--text-muted)' }}>
                {wordCount(review)} / 250 words
              </span>
            </div>
            <textarea
              className="input-control"
              rows={3}
              placeholder="Write an optional review (up to 250 words)..."
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
            <button type="button" onClick={handleClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || (status === 'currently_reading' && currentReadingCount >= 4)}
            >
              {loading ? 'Adding...' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
