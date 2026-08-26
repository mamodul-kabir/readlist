import { NextRequest, NextResponse } from 'next/server';
import db, { User } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  // Rate limit: Max 5 login attempts per minute per IP
  const rateCheck = checkRateLimit(req, 'auth-login', 5, 60 * 1000);
  if (!rateCheck.success) {
    return rateCheck.response!;
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.get<User>('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const token = signToken({ id: user.id, email: user.email, tag: user.tag });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        tag: user.tag,
        name: user.name,
        is_private: user.is_private
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to log in.' },
      { status: 500 }
    );
  }
}
