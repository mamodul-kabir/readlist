import { NextRequest, NextResponse } from 'next/server';
import db, { User } from '@/lib/db';
import { hashPassword, normalizeTag, signToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { validateEmail } from '@/lib/validation';

export async function POST(req: NextRequest) {
  // Rate limit: Max 5 signups per minute per IP
  const rateCheck = checkRateLimit(req, 'auth-signup', 5, 60 * 1000);
  if (!rateCheck.success) {
    return rateCheck.response!;
  }

  try {
    const { email, password, tag, name } = await req.json();

    if (!email || !password || !tag || !name) {
      return NextResponse.json(
        { error: 'Email, password, user tag, and name are required.' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (typeof name !== 'string' || name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Name cannot exceed 100 characters.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanTag = normalizeTag(tag);

    if (cleanTag.length < 2 || cleanTag.length > 30) {
      return NextResponse.json(
        { error: 'User tag must be between 2 and 30 characters.' },
        { status: 400 }
      );
    }

    if (password.length < 6 || password.length > 100) {
      return NextResponse.json(
        { error: 'Password must be between 6 and 100 characters.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await db.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    // Check if tag already exists
    const existingTag = await db.get('SELECT id FROM users WHERE tag = ?', [cleanTag]);
    if (existingTag) {
      return NextResponse.json(
        { error: `The tag "@${cleanTag}" is already taken. Please choose another.` },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const result = await db.run(
      'INSERT INTO users (email, password, tag, name, is_private) VALUES (?, ?, ?, ?, 0)',
      [cleanEmail, hashedPassword, cleanTag, name.trim()]
    );

    const userId = Number(result.lastInsertRowid);
    const token = signToken({ id: userId, email: cleanEmail, tag: cleanTag });

    const response = NextResponse.json({
      user: {
        id: userId,
        email: cleanEmail,
        tag: cleanTag,
        name: name.trim(),
        is_private: 0
      }
    });

    response.cookies.set('readlist_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account.' },
      { status: 500 }
    );
  }
}
