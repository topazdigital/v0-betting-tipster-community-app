import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get all matches for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const sportId = searchParams.get('sportId');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const params: (string | number)[] = [];
    
    if (status && status !== 'all') {
      whereClause += ' AND m.status = ?';
      params.push(status);
    }
    
    if (sportId && sportId !== 'all') {
      whereClause += ' AND l.sport_id = ?';
      params.push(parseInt(sportId));
    }
    
    if (search) {
      whereClause += ' AND (ht.name LIKE ? OR at.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Get matches with team and league info
    const result = await query(`
      SELECT 
        m.id,
        m.kickoff_time,
        m.status,
        m.home_score,
        m.away_score,
        m.minute,
        ht.name as home_team_name,
        ht.logo_url as home_team_logo,
        at.name as away_team_name,
        at.logo_url as away_team_logo,
        l.name as league_name,
        l.country_id,
        s.name as sport_name,
        s.icon as sport_icon
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN leagues l ON m.league_id = l.id
      JOIN sports s ON l.sport_id = s.id
      WHERE ${whereClause}
      ORDER BY m.kickoff_time DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);
    
    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM matches m
      JOIN leagues l ON m.league_id = l.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE ${whereClause}
    `, params);
    
    const total = (countResult.rows as Array<{ total: number }>)[0]?.total || 0;
    
    return NextResponse.json({
      matches: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[Admin API] Failed to get matches:', error);
    return NextResponse.json(
      { error: 'Failed to get matches', matches: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } },
      { status: 500 }
    );
  }
}

// Create a new match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      leagueId,
      homeTeamId,
      awayTeamId,
      kickoffTime,
      homeOdds,
      drawOdds,
      awayOdds
    } = body;
    
    // Validate required fields
    if (!leagueId || !homeTeamId || !awayTeamId || !kickoffTime) {
      return NextResponse.json(
        { error: 'Missing required fields: leagueId, homeTeamId, awayTeamId, kickoffTime' },
        { status: 400 }
      );
    }
    
    // Insert match
    const { execute: execQuery } = await import('@/lib/db');
    const result = await execQuery(
      `INSERT INTO matches (league_id, home_team_id, away_team_id, kickoff_time, status)
       VALUES (?, ?, ?, ?, 'scheduled')`,
      [leagueId, homeTeamId, awayTeamId, kickoffTime]
    );
    
    const matchId = result.insertId;
    
    // If odds provided, insert them
    if (homeOdds && awayOdds) {
      // Get first available bookmaker or create default
      const bookmakerResult = await query(`
        SELECT id FROM bookmakers LIMIT 1
      `);
      
      const bookmakerId = (bookmakerResult.rows as Array<{ id: number }>)[0]?.id;
      
      if (bookmakerId) {
        // Get or create the h2h market
        const marketResult = await query(`
          SELECT id FROM markets WHERE slug = 'h2h' LIMIT 1
        `);
        
        const marketId = (marketResult.rows as Array<{ id: number }>)[0]?.id || 1;
        
        // Insert odds
        await query(`
          INSERT INTO odds (match_id, bookmaker_id, market_id, selection, value)
          VALUES 
            (?, ?, ?, 'home', ?),
            (?, ?, ?, 'draw', ?),
            (?, ?, ?, 'away', ?)
        `, [
          matchId, bookmakerId, marketId, homeOdds,
          matchId, bookmakerId, marketId, drawOdds || 3.0,
          matchId, bookmakerId, marketId, awayOdds
        ]);
      }
    }
    
    return NextResponse.json({
      success: true,
      matchId,
      message: 'Match created successfully'
    });
  } catch (error) {
    console.error('[Admin API] Failed to create match:', error);
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    );
  }
}

// Update match
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, homeScore, awayScore, minute } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }
    
    const updates: string[] = [];
    const params: (string | number)[] = [];
    
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (homeScore !== undefined) {
      updates.push('home_score = ?');
      params.push(homeScore);
    }
    
    if (awayScore !== undefined) {
      updates.push('away_score = ?');
      params.push(awayScore);
    }
    
    if (minute !== undefined) {
      updates.push('minute = ?');
      params.push(minute);
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }
    
    params.push(id);
    
    await query(`
      UPDATE matches
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);
    
    return NextResponse.json({
      success: true,
      message: 'Match updated successfully'
    });
  } catch (error) {
    console.error('[Admin API] Failed to update match:', error);
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    );
  }
}

// Delete match
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }
    
    await query('DELETE FROM matches WHERE id = ?', [id]);
    
    return NextResponse.json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    console.error('[Admin API] Failed to delete match:', error);
    return NextResponse.json(
      { error: 'Failed to delete match' },
      { status: 500 }
    );
  }
}
