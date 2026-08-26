import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'ReadList - Minimalist Reading Log & Book Tracker',
  description: 'Track books you are currently reading, organize read books by year, write short reviews, and share your personal reading list with the world.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 120px)', paddingBottom: '3rem' }}>
          {children}
        </main>
        <footer style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '2rem 0',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <div className="container">
            <p>© {new Date().getFullYear()} ReadList. Minimalist book tracking & annual reading log.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
