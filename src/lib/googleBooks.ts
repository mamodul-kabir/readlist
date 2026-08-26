export interface GoogleBookSearchResult {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  googleSearchUrl: string;
  publishedDate?: string;
  description?: string;
}

const searchCache = new Map<string, { items: GoogleBookSearchResult[]; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

async function searchOpenLibrary(query: string): Promise<GoogleBookSearchResult[]> {
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=15`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
      console.error('Open Library API response not ok:', res.statusText);
      return [];
    }
    const data = await res.json();
    if (!data.docs || !Array.isArray(data.docs)) {
      return [];
    }
    return data.docs.map((doc: any) => {
      const title = doc.title || 'Untitled Book';
      const authors = Array.isArray(doc.author_name) ? doc.author_name : [];
      const coverUrl = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null;
      const searchQuery = `${title} ${authors.length > 0 ? authors.join(' ') : ''}`.trim();
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

      return {
        id: doc.key || Math.random().toString(36).substring(2),
        title,
        authors,
        coverUrl,
        googleSearchUrl,
        publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : undefined
      };
    });
  } catch (err) {
    console.error('Error fetching from Open Library API fallback:', err);
    return [];
  }
}

export async function searchGoogleBooks(query: string): Promise<GoogleBookSearchResult[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  // Check in-memory cache first
  const cached = searchCache.get(normalizedQuery);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.items;
  }

  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const apiKeyParam = apiKey ? `&key=${apiKey}` : '';
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&printType=books${apiKeyParam}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!res.ok) {
      console.warn(`Google Books API returned status ${res.status} (${res.statusText}). Triggering fallback search...`);
      // If rate limited (429) or failing, fallback to Open Library API
      const fallbackResults = await searchOpenLibrary(query);
      if (fallbackResults.length > 0) {
        searchCache.set(normalizedQuery, { items: fallbackResults, timestamp: Date.now() });
      }
      return fallbackResults;
    }

    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) {
      // Try fallback if no items found from Google Books
      const fallbackResults = await searchOpenLibrary(query);
      if (fallbackResults.length > 0) {
        searchCache.set(normalizedQuery, { items: fallbackResults, timestamp: Date.now() });
        return fallbackResults;
      }
      return [];
    }

    const items: GoogleBookSearchResult[] = data.items.map((item: any) => {
      const volumeInfo = item.volumeInfo || {};
      const title = volumeInfo.title || 'Untitled Book';
      const authors = Array.isArray(volumeInfo.authors) ? volumeInfo.authors : [];
      let thumbnail = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || null;
      
      // Convert http thumbnail URLs to https to avoid mixed-content issues
      if (thumbnail && thumbnail.startsWith('http:')) {
        thumbnail = thumbnail.replace('http:', 'https:');
      }

      const searchQuery = `${title} ${authors.length > 0 ? authors.join(' ') : ''}`.trim();
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

      return {
        id: item.id || Math.random().toString(36).substring(2),
        title,
        authors,
        coverUrl: thumbnail,
        googleSearchUrl,
        publishedDate: volumeInfo.publishedDate,
        description: volumeInfo.description ? volumeInfo.description.slice(0, 200) + '...' : undefined
      };
    });

    searchCache.set(normalizedQuery, { items, timestamp: Date.now() });
    return items;
  } catch (err) {
    console.error('Error searching Google Books API, attempting fallback:', err);
    const fallbackResults = await searchOpenLibrary(query);
    if (fallbackResults.length > 0) {
      searchCache.set(normalizedQuery, { items: fallbackResults, timestamp: Date.now() });
    }
    return fallbackResults;
  }
}

