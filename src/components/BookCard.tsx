'use client';

import { useState } from 'react';
import { Book } from '@/lib/db';

interface BookCardProps {
  book: Book;
  isOwner?: boolean;
  onStatusChange?: (bookId: number, newStatus: 'read' | 'unfinished', extraData?: { finish_date?: string; year?: number; review?: string }) => void;
  onEdit?: (book: Book) => void;
  onDelete?: (bookId: number) => void;
}

export default function BookCard({ book, isOwner, onStatusChange, onEdit, onDelete }: BookCardProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMarkReadModal, setShowMarkReadModal] = useState(false);
  const [finishDate, setFinishDate] = useState('');
  const [finishYear, setFinishYear] = useState(new Date().getFullYear().toString());
  const [newReview, setNewReview] = useState('');

  // Handle masked 'book-hidden' cards for public visitors
  if (book.title === 'book-hidden') {
    return (
      <div className="book-card" style={{
        backgroundColor: 'var(--surface)',
        border: '1px dashed var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        opacity: 0.85
      }}>
        <div style={{
          width: '54px',
          height: '80px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem',
          flexShrink: 0
        }}>
          🔒
        </div>
        <div>
          <h3 className="font-serif" style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            book-hidden
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Currently reading (Private Book)
          </p>
        </div>
      </div>
    );
  }

  const wordCount = (text: string | null) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleMarkAsReadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onStatusChange) {
      onStatusChange(book.id, 'read', {
        finish_date: finishDate || undefined,
        year: finishYear ? parseInt(finishYear, 10) : undefined,
        review: newReview || undefined
      });
    }
    setShowMarkReadModal(false);
  };

  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      boxShadow: 'var(--shadow-sm)'
    }}
    className="book-card"
    >
      <div>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              style={{
                width: '64px',
                height: '96px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--surface-hover)',
                flexShrink: 0
              }}
            />
          ) : (
            <div style={{
              width: '64px',
              height: '96px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-light)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 600,
              flexShrink: 0
            }}>
              📖
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="font-serif" style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              lineHeight: 1.3,
              marginBottom: '0.25rem',
              color: 'var(--text-primary)',
              wordBreak: 'break-word'
            }}>
              <a
                href={book.google_search_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Search this book on Google"
                style={{
                  color: 'inherit',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                {book.title}
              </a>
            </h3>

            {book.authors && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                by {book.authors}
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', marginTop: '0.4rem' }}>
              <span className={`badge badge-${book.status === 'currently_reading' ? 'reading' : book.status === 'read' ? 'read' : 'unfinished'}`}>
                {book.status === 'currently_reading' ? 'Reading' : book.status === 'read' ? 'Read' : 'Unfinished'}
              </span>

              {isOwner && Boolean(book.is_hidden) && (
                <span className="badge badge-unfinished" style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border)' }}>
                  🔒 Private
                </span>
              )}

              {book.start_date && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Started: {book.start_date}
                </span>
              )}

              {book.finish_date && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Finished: {book.finish_date}
                </span>
              )}

              {!book.finish_date && book.year && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Year: {book.year}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Review toggle button */}
        {book.review && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-subtle)' }}>
            <button
              onClick={() => setShowReviewModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'space-between' }}
            >
              <span>💬 Read Review ({wordCount(book.review)} words)</span>
              <span>↓</span>
            </button>
          </div>
        )}
      </div>

      {/* External Search Link & Owner Controls */}
      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <a
          href={book.google_search_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
        >
          <span>Google Search</span> ↗
        </a>

        {isOwner && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {book.status === 'currently_reading' && (
              <>
                <button
                  onClick={() => setShowMarkReadModal(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--success)', borderColor: 'rgba(21, 128, 61, 0.3)' }}
                >
                  ✓ Mark Read
                </button>

                {onStatusChange && (
                  <button
                    onClick={() => onStatusChange(book.id, 'unfinished')}
                    className="btn btn-secondary btn-sm"
                  >
                    Unfinished
                  </button>
                )}
              </>
            )}

            {onEdit && (
              <button onClick={() => onEdit(book)} className="btn btn-secondary btn-sm">
                Edit
              </button>
            )}

            {onDelete && (
              <button onClick={() => onDelete(book.id)} className="btn btn-danger btn-sm">
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && book.review && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 className="font-serif" style={{ fontSize: '1.2rem' }}>{book.title}</h3>
                {book.authors && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>by {book.authors}</p>}
              </div>
              <button onClick={() => setShowReviewModal(false)} className="btn-icon">✕</button>
            </div>
            
            <div style={{ margin: '1rem 0', maxHeight: '300px', overflowY: 'auto' }}>
              <p className="font-serif" style={{ fontSize: '1rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                "{book.review}"
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Review length: {wordCount(book.review)} words (max 250)</span>
              <button onClick={() => setShowReviewModal(false)} className="btn btn-secondary btn-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Mark As Read Modal */}
      {showMarkReadModal && (
        <div className="modal-overlay" onClick={() => setShowMarkReadModal(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              Mark "{book.title}" as Read
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Add optional completion date, year, and a review (up to 250 words).
            </p>

            <form onSubmit={handleMarkAsReadSubmit}>
              <div className="input-group">
                <label className="input-label">Completion Year</label>
                <input
                  type="number"
                  className="input-control"
                  placeholder="e.g. 2026"
                  value={finishYear}
                  onChange={(e) => setFinishYear(e.target.value)}
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

              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="input-label">Optional Review</label>
                  <span style={{ fontSize: '0.75rem', color: wordCount(newReview) > 250 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {wordCount(newReview)} / 250 words
                  </span>
                </div>
                <textarea
                  className="input-control"
                  rows={4}
                  placeholder="Write your review or thoughts on the book..."
                  value={newReview}
                  onChange={(e) => {
                    const text = e.target.value;
                    if (wordCount(text) <= 250 || text.length < newReview.length) {
                      setNewReview(text);
                    }
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowMarkReadModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Mark as Read
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
