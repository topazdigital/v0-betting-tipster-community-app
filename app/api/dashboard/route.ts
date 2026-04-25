import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listFollowedTeams, listFollowedTipsters } from '@/lib/follows-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TeamApiResponse {
  team?: { id?: string; name?: string; logo?: string };
  past?: unknown[];
  upcoming?: unknown[];
}

async function fetchTeamData(teamId: string, baseUrl: string): Promise<TeamApiResponse | null> {
  try {
    const r = await fetch(`${baseUrl}/api/teams/${encodeURIComponent(teamId)}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!r.ok) return null;
    return (await r.json()) as TeamApiResponse;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({
      authenticated: false,
      teams: [],
      upcomingMatches: [],
      recentResults: [],
      followedTipsters: [],
    });
  }
  const [followedTeams, followedTipsterIds] = await Promise.all([
    listFollowedTeams(user.userId),
    listFollowedTipsters(user.userId),
  ]);
  if (followedTeams.length === 0) {
    return NextResponse.json({
      authenticated: true,
      teams: [],
      upcomingMatches: [],
      recentResults: [],
      followedTipsters: followedTipsterIds,
    });
  }

  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const teamData = await Promise.all(
    followedTeams.slice(0, 12).map(t => fetchTeamData(t.teamId, baseUrl).then(d => ({ follow: t, data: d })))
  );

  const upcomingMatches: Array<Record<string, unknown>> = [];
  const recentResults: Array<Record<string, unknown>> = [];
  for (const { follow, data } of teamData) {
    const teamObj = {
      id: follow.teamId,
      name: data?.team?.name || follow.teamName,
      logo: data?.team?.logo || follow.teamLogo,
    };
    for (const ev of (data?.upcoming || []).slice(0, 3)) {
      upcomingMatches.push({ ...(ev as object), team: teamObj, league: { name: follow.leagueName, slug: follow.leagueSlug, countryCode: follow.countryCode } });
    }
    for (const ev of (data?.past || []).slice(0, 3)) {
      recentResults.push({ ...(ev as object), team: teamObj, league: { name: follow.leagueName, slug: follow.leagueSlug, countryCode: follow.countryCode } });
    }
  }

  upcomingMatches.sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime());
  recentResults.sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());

  return NextResponse.json({
    authenticated: true,
    teams: followedTeams,
    upcomingMatches: upcomingMatches.slice(0, 20),
    recentResults: recentResults.slice(0, 20),
    followedTipsters: followedTipsterIds,
  });
}
