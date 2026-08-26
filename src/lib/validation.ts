export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string' || email.length > 100) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

export function validateBookPayload(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid payload format.' };
  }

  const { title, authors, review } = data;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return { valid: false, error: 'Book title is required.' };
  }

  if (title.trim().length > 250) {
    return { valid: false, error: 'Book title cannot exceed 250 characters.' };
  }

  if (authors && typeof authors === 'string' && authors.trim().length > 250) {
    return { valid: false, error: 'Authors text cannot exceed 250 characters.' };
  }

  if (review && typeof review === 'string') {
    const trimmed = review.trim();
    if (trimmed.length > 3000) {
      return { valid: false, error: 'Review is too long (max 3,000 characters).' };
    }
    if (countWords(trimmed) > 250) {
      return { valid: false, error: 'Review exceeds the 250-word limit.' };
    }
  }

  return { valid: true };
}
