import { NextResponse } from 'next/server';
import { setAuthCookie, verifyPassword } from '@/lib/auth';
import { mockUsers } from '@/lib/mock-data';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // In development/preview, allow demo login
    // Demo credentials: admin@betcheza.co.ke / admin123
    const user = mockUsers.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // In development, accept 'admin123' as password for demo
    const isDemoPassword = password === 'admin123';
    const isValidPassword = isDemoPassword || await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Set auth cookie
    await setAuthCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        role: user.role,
        balance: user.balance,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
