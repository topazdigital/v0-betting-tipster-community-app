import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get all settings
export async function GET() {
  try {
    const result = await query(`
      SELECT setting_key, setting_value, description
      FROM site_settings
      ORDER BY setting_key
    `);
    
    // Convert to object format
    const settings: Record<string, string> = {};
    const rows = result.rows as Array<{ setting_key: string; setting_value: string }>;
    
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[Admin API] Failed to get settings:', error);
    
    // Return default settings on error
    return NextResponse.json({
      settings: {
        site_name: 'Betcheza',
        site_description: 'Your trusted betting tips community',
        default_theme: 'light',
        maintenance_mode: 'false',
        registration_enabled: 'true',
        email_verification: 'true',
        tipsters_auto_approval: 'false',
        comments_moderation: 'true',
        max_predictions_per_day: '10',
        min_odds_allowed: '1.2',
        max_odds_allowed: '50',
        primary_color: '#10B981'
      }
    });
  }
}

// Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }
    
    // Upsert each setting
    for (const [key, value] of Object.entries(settings)) {
      await query(`
        INSERT INTO site_settings (setting_key, setting_value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
      `, [key, String(value)]);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Settings saved successfully' 
    });
  } catch (error) {
    console.error('[Admin API] Failed to save settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
