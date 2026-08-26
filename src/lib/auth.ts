import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import db, { User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'readlist-super-secret-key-2026';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(password, hashed);
}

export function signToken(user: { id: number; email: string; tag: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, tag: user.tag },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): { id: number; email: string; tag: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string; tag: string };
  } catch (err) {
    return null;
  }
}

export function normalizeTag(tagInput: string): string {
  // Remove leading '@' if present, convert to lowercase, trim whitespace
  let clean = tagInput.trim().toLowerCase();
  if (clean.startsWith('@')) {
    clean = clean.substring(1);
  }
  // Remove any non-alphanumeric, hyphen, or underscore characters
  return clean.replace(/[^a-z0-9_-]/g, '');
}

export async function getAuthenticatedUser(req: NextRequest): Promise<User | null> {
  const token = req.cookies.get('readlist_token')?.value || 
                req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await db.get<User>('SELECT id, email, tag, name, is_private, created_at FROM users WHERE id = ?', [payload.id]);
  return user || null;
}
