import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { mockUsers } from '@/lib/mock-data';

export async function GET() {
  try {
    const authUser = await getCurrentUser();
    
    if (!authUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // In development/preview, use mock data
    const user = mockUsers.find((u) => u.id === authUser.userId);
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
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
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
