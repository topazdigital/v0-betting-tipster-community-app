import { NextResponse } from 'next/server';
import { hashPassword, setAuthCookie } from '@/lib/auth';
import { mockUsers } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { email, password, username, displayName, phone, countryCode } = body;

    // Validation
    if (!email || !password || !username || !displayName) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if email exists
    const existingEmail = mockUsers.find((u) => u.email === email);
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if username exists
    const existingUsername = mockUsers.find((u) => u.username === username);
    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 400 }
      );
    }

    // In production, you would insert into database
    // For preview, we'll create a mock user
    const passwordHash = await hashPassword(password);
    
    const newUser = {
      id: mockUsers.length + 1,
      email,
      phone: phone || null,
      country_code: countryCode || null,
      password_hash: passwordHash,
      google_id: null,
      username,
      display_name: displayName,
      avatar_url: null,
      bio: null,
      role: 'user' as const,
      balance: 0,
      timezone: 'Africa/Nairobi',
      odds_format: 'decimal' as const,
      is_verified: false,
      created_at: new Date(),
    };

    // Add to mock users (in memory only for preview)
    mockUsers.push(newUser);

    // Set auth cookie
    await setAuthCookie({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        displayName: newUser.display_name,
        avatarUrl: newUser.avatar_url,
        role: newUser.role,
        balance: newUser.balance,
      },
    });
  } catch (error) {
    console.error('[v0] Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
