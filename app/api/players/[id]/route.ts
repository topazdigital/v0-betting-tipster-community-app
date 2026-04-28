import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ESPNAthlete {
  id?: string | number;
  uid?: string;
  guid?: string;
  type?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;
  shortName?: string;
  weight?: number;
  displayWeight?: string;
  height?: number;
  displayHeight?: string;
  age?: number;
  dateOfBirth?: string;
  birthPlace?: { city?: string; country?: string };
  citizenship?: string;
  jersey?: string;
  position?: { id?: string; name?: string; displayName?: string; abbreviation?: string };
  team?: { id?: string; displayName?: string; logos?: Array<{ href?: string }> };
  headshot?: { href?: string; alt?: string };
  status?: { name?: string };
  experience?: { years?: number };
  flag?: { href?: string; alt?: string };
}

interface ESPNAthleteResponse {
  athlete?: ESPNAthlete;
  statistics?: { splits?: { categories?: Array<{ name?: string; displayName?: string; stats?: Array<{ name?: string; displayName?: string; displayValue?: string; value?: number }> }> } };
  // Some endpoints wrap in a different shape — keep both.
}

const SPORT_PATHS = [
  // Order matters — try the most popular first to minimise round-trips.
  'soccer/eng.1', 'soccer/esp.1', 'soccer/ita.1', 'soccer/ger.1', 'soccer/fra.1',
  'soccer/usa.1', 'soccer/uefa.champions',
  'basketball/nba', 'basketball/wnba', 'basketball/mens-college-basketball',
  'football/nfl', 'football/college-football',
  'baseball/mlb', 'hockey/nhl',
  'mma/ufc', 'tennis/atp', 'tennis/wta',
];

async function fetchAthlete(sportPath: string, id: string): Promise<ESPNAthlete | null> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/athletes/${id}`;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 1800 } });
    if (!r.ok) return null;
    const data = (await r.json()) as ESPNAthleteResponse;
    return data.athlete ?? null;
  } catch {
    return null;
  }
}

async function fetchAthleteStats(sportPath: string, id: string) {
  const url = `https://site.web.api.espn.com/apis/common/v3/sports/${sportPath}/athletes/${id}/stats`;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // Probe sports endpoints in parallel — first hit wins.
  const probe = await Promise.all(
    SPORT_PATHS.map(async (p) => {
      const a = await fetchAthlete(p, id);
      return a ? { sportPath: p, athlete: a } : null;
    }),
  );
  const found = probe.find((x): x is { sportPath: string; athlete: ESPNAthlete } => !!x);
  if (!found) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  const stats = await fetchAthleteStats(found.sportPath, id).catch(() => null);

  const a = found.athlete;
  const headshot = a.headshot?.href
    || `https://a.espncdn.com/i/headshots/${found.sportPath.split('/')[0]}/players/full/${id}.png`;

  return NextResponse.json({
    id: String(a.id ?? id),
    name: a.displayName || a.fullName || `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim(),
    firstName: a.firstName,
    lastName: a.lastName,
    shortName: a.shortName,
    position: a.position?.displayName || a.position?.name || a.position?.abbreviation,
    jersey: a.jersey,
    team: a.team
      ? {
          id: a.team.id,
          name: a.team.displayName,
          logo: a.team.logos?.[0]?.href,
        }
      : null,
    height: a.displayHeight,
    weight: a.displayWeight,
    age: a.age,
    dateOfBirth: a.dateOfBirth,
    birthPlace: a.birthPlace,
    nationality: a.citizenship,
    flag: a.flag?.href,
    experienceYears: a.experience?.years,
    status: a.status?.name,
    headshot,
    sportPath: found.sportPath,
    stats: stats || null,
  });
}
