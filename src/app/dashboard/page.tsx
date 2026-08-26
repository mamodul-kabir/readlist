'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Book } from '@/lib/db';
import BookCard from '@/components/BookCard';
import AddBookModal from '@/components/AddBookModal';
import EditBookModal from '@/components/EditBookModal';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'currently_reading' | 'read' | 'unfinished'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialStatus, setAddModalInitialStatus] = useState<'currently_reading' | 'read' | 'unfinished'>('read');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const router = useRouter();

  const openAddModal = (initialStatus: 'currently_reading' | 'read' | 'unfinished' = 'read') => {
    setAddModalInitialStatus(initialStatus);
    setIsAddModalOpen(true);
  };

  const fetchUserAndBooks = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();

      if (!meData.user) {
        router.push('/login');
        return;
      }

      setUser(meData.user);

      const booksRes = await fetch('/api/books');
      const booksData = await booksRes.json();
      setBooks(booksData.books || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndBooks();
  }, []);

  const currentlyReadingBooks = books.filter((b) => b.status === 'currently_reading');
  const readBooks = books.filter((b) => b.status === 'read');
  const unfinishedBooks = books.filter((b) => b.status === 'unfinished');

  const filteredBooks = books.filter((b) => {
    if (activeTab === 'currently_reading') return b.status === 'currently_reading';
    if (activeTab === 'read') return b.status === 'read';
    if (activeTab === 'unfinished') return b.status === 'unfinished';
    return true;
  });

  const handleStatusChange = async (bookId: number, newStatus: 'read' | 'unfinished', extraData?: any) => {
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          ...extraData
        })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update book status');
        return;
      }

      fetchUserAndBooks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBook = async (bookId: number) => {
    if (!confirm('Are you sure you want to remove this book?')) return;

    try {
      const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b.id !== bookId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--border)'
      }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
            {user?.name}'s Dashboard
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Public Profile: <Link href={`/@${user?.tag}`} target="_blank" style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'underline' }}>
              /@{user?.tag}
            </Link> {user?.is_private ? '(🔒 Private Account)' : '(🌐 Public)'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => openAddModal('read')}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.2rem' }}
          >
            + Add a Book
          </button>
        </div>
      </div>

      {/* Currently Reading Banner Notice if approaching limit */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📖 Currently Reading</span>
            <span className={`badge ${currentlyReadingBooks.length >= 4 ? 'badge-reading' : 'badge-unfinished'}`}>
              {currentlyReadingBooks.length} / 4 max
            </span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {currentlyReadingBooks.length >= 4
              ? 'You have reached the maximum limit of 4 currently reading books. Finish or move a book to add more.'
              : `You can add up to ${4 - currentlyReadingBooks.length} more book(s) to your currently reading list.`}
          </p>
        </div>

        <button
          onClick={() => openAddModal('currently_reading')}
          className="btn btn-secondary btn-sm"
          disabled={currentlyReadingBooks.length >= 4}
        >
          {currentlyReadingBooks.length >= 4 ? 'Limit Reached (4/4)' : '+ Add to Currently Reading'}
        </button>
      </div>

      {/* Tab Filter Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('all')}
          className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All Books ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('currently_reading')}
          className={`btn btn-sm ${activeTab === 'currently_reading' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Currently Reading ({currentlyReadingBooks.length})
        </button>
        <button
          onClick={() => setActiveTab('read')}
          className={`btn btn-sm ${activeTab === 'read' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Read ({readBooks.length})
        </button>
        <button
          onClick={() => setActiveTab('unfinished')}
          className={`btn btn-sm ${activeTab === 'unfinished' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Unfinished / Misc ({unfinishedBooks.length})
        </button>
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 1.5rem',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--surface-hover)'
        }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📚</span>
          <h3 className="font-serif" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            No books found in this section
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Start building your reading list by searching and adding books.
          </p>
          <button onClick={() => openAddModal('read')} className="btn btn-primary btn-sm">
            + Add Your First Book
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem'
        }}>
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              isOwner={true}
              onStatusChange={handleStatusChange}
              onEdit={(b) => setEditingBook(b)}
              onDelete={handleDeleteBook}
            />
          ))}
        </div>
      )}

      {/* Add Book Modal */}
      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchUserAndBooks}
        currentReadingCount={currentlyReadingBooks.length}
        initialStatus={addModalInitialStatus}
      />

      {/* Edit Book Modal */}
      <EditBookModal
        book={editingBook}
        isOpen={Boolean(editingBook)}
        onClose={() => setEditingBook(null)}
        onSuccess={fetchUserAndBooks}
        currentReadingCount={currentlyReadingBooks.length}
      />
    </div>
  );
}
