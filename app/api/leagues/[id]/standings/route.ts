import { NextRequest, NextResponse } from 'next/server';
import { getLeagueStandings } from '@/lib/api/unified-sports-api';

export const dynamic = 'force-dynamic';
export const revalidate = 900; // Revalidate every 15 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leagueId = parseInt(id);

    if (isNaN(leagueId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid league ID' },
        { status: 400 }
      );
    }

    const standings = await getLeagueStandings(leagueId);

    return NextResponse.json({
      success: true,
      data: standings,
    });
  } catch (error) {
    console.error('[API] Error fetching standings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch standings' },
      { status: 500 }
    );
  }
}
