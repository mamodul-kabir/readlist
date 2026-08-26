import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAuthenticatedUser, hashPassword } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function PUT(req: NextRequest) {
  const rateCheck = checkRateLimit(req, 'user-settings', 10, 60 * 1000);
  if (!rateCheck.success) return rateCheck.response!;

  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { is_private, name, password } = await req.json();

    let query = 'UPDATE users SET ';
    const params: any[] = [];

    if (typeof is_private === 'number' || typeof is_private === 'boolean') {
      query += 'is_private = ?, ';
      params.push(is_private ? 1 : 0);
    }

    if (name && typeof name === 'string' && name.trim()) {
      query += 'name = ?, ';
      params.push(name.trim());
    }

    if (password && typeof password === 'string' && password.length >= 6) {
      const hashed = await hashPassword(password);
      query += 'password = ?, ';
      params.push(hashed);
    }

    if (params.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Remove trailing comma
    query = query.slice(0, -2) + ' WHERE id = ?';
    params.push(currentUser.id);

    await db.run(query, params);

    const updatedUser = await db.get('SELECT id, email, tag, name, is_private, created_at FROM users WHERE id = ?', [currentUser.id]);

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
