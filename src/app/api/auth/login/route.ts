import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    const user = dbStore.getUserByUsername(username);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Akun tidak ditemukan atau tidak aktif' },
        { status: 401 }
      );
    }

    // In production verify with bcrypt.compare
    if (user.passwordHash !== password) {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      );
    }

    const token = createSessionToken(user);

    // Audit log login
    await dbStore.logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'users',
      entityId: user.id,
      details: JSON.stringify({ username: user.username, role: user.role }),
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      token,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 12, // 12 hours
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat login', details: error.message },
      { status: 500 }
    );
  }
}
