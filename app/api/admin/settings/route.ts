import { NextRequest, NextResponse } from 'next/server';
import { query, execute, getPool } from '@/lib/db';
import { invalidateSiteSettingsCache } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

// In-memory storage for development mode when no database. Exposed on
// globalThis so the public site-settings reader picks up admin updates
// even when no DB is configured.
const g = globalThis as { __memorySettings?: Record<string, string> };
const memorySettings: Record<string, string> = g.__memorySettings ?? (g.__memorySettings = {
  site_name: 'Betcheza',
  site_description: 'Your trusted betting tips community. Get expert predictions, track your performance, and compete with other tipsters.',
  default_theme: 'light',
  maintenance_mode: 'false',
  registration_enabled: 'true',
  email_verification: 'true',
  tipsters_auto_approval: 'false',
  comments_moderation: 'true',
  max_predictions_per_day: '10',
  min_odds_allowed: '1.2',
  max_odds_allowed: '50',
  primary_color: '#10B981',
  default_odds_format: 'decimal',
  notify_new_user: 'true',
  notify_new_prediction: 'true',
  notify_new_comment: 'false',
  google_analytics_id: '',
  facebook_pixel_id: '',
  logo_url: '',
  logo_dark_url: '',
  favicon_url: '',
  twofa_enabled: 'false',
  twofa_method: 'email',
  url_rewrites: '[]',
  seo_pages: '[]',
});

// Get all settings
export async function GET() {
  const pool = getPool();
  
  // If no database, return memory settings
  if (!pool) {
    return NextResponse.json({ 
      settings: memorySettings,
      source: 'memory'
    });
  }
  
  try {
    const result = await query<{ setting_key: string; setting_value: string }>(`
      SELECT setting_key, setting_value
      FROM site_settings
      ORDER BY setting_key
    `);
    
    // Convert to object format
    const settings: Record<string, string> = { ...memorySettings };
    
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    return NextResponse.json({ 
      settings,
      source: 'database'
    });
  } catch (error) {
    console.error('[Admin API] Failed to get settings:', error);
    
    // Return default settings on error
    return NextResponse.json({
      settings: memorySettings,
      source: 'memory'
    });
  }
}

// Update settings
export async function POST(request: NextRequest) {
  const pool = getPool();
  
  try {
    const body = await request.json();
    const { settings } = body;
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }
    
    // Always update in-memory copy so non-DB readers + cache reflect change
    Object.assign(memorySettings, settings);
    invalidateSiteSettingsCache();

    // If no database, store in memory only
    if (!pool) {
      return NextResponse.json({ 
        success: true, 
        message: 'Settings saved to memory (no database connection)',
        source: 'memory'
      });
    }
    
    // Upsert each setting to database
    for (const [key, value] of Object.entries(settings)) {
      await execute(`
        INSERT INTO site_settings (setting_key, setting_value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
      `, [key, String(value)]);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Settings saved to database',
      source: 'database'
    });
  } catch (error) {
    console.error('[Admin API] Failed to save settings:', error);
    
    // Try to save to memory as fallback
    try {
      const body = await request.json();
      if (body.settings) {
        Object.assign(memorySettings, body.settings);
        return NextResponse.json({ 
          success: true, 
          message: 'Settings saved to memory (database error)',
          source: 'memory'
        });
      }
    } catch {
      // Ignore
    }
    
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
