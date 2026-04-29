import { NextResponse } from 'next/server';
import { hashPassword, setAuthCookie } from '@/lib/auth';
import { mockUsers } from '@/lib/mock-data';
import { sendMail } from '@/lib/mailer';
import { ipKeyFromHeaders, rateLimit } from '@/lib/rate-limit';
import { getCaptchaProvider, recallMathAnswer, verifyCaptcha } from '@/lib/captcha';

export const dynamic = 'force-dynamic';

function buildRegistrationEmail(opts: { displayName: string; username: string; email: string; appUrl: string }) {
  const { displayName, username, email, appUrl } = opts;
  const text = `Welcome to Betcheza, ${displayName}!

Your account is ready.

Username: ${username}
Email: ${email}

What you can do right now:
• Browse today's matches and live odds
• Follow your favourite teams and tipsters
• Open the AI Prediction widget on any match
• Save picks and track your ROI in your dashboard

Open the app: ${appUrl}

Bet smart. Bet small. — Team Betcheza`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#10b981 0%,#0ea5e9 100%);padding:28px 32px;color:#fff;">
          <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Welcome aboard, ${displayName} 👋</h1>
          <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Your Betcheza account is live and ready to bet smart.</p>
        </td></tr>
        <tr><td style="padding:28px 32px;color:#0f172a;">
          <p style="margin:0 0 14px;font-size:15px;line-height:1.55;">Thanks for joining Betcheza — we're glad to have you.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;margin:0 0 22px;">
            <tr><td style="padding:14px 18px;font-size:13px;color:#475569;">
              <div style="margin-bottom:6px;"><strong style="color:#0f172a;">Username:</strong> ${username}</div>
              <div><strong style="color:#0f172a;">Email:</strong> ${email}</div>
            </td></tr>
          </table>
          <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0f172a;">What you can do right now</p>
          <ul style="margin:0 0 22px;padding:0 0 0 20px;font-size:14px;line-height:1.65;color:#334155;">
            <li>Browse today's matches with live odds across 200+ leagues</li>
            <li>Follow your favourite teams &amp; tipsters for instant alerts</li>
            <li>Open the AI Prediction widget on any match for a value read</li>
            <li>Save picks and track your ROI in your personal dashboard</li>
          </ul>
          <p style="margin:0 0 26px;text-align:center;">
            <a href="${appUrl}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;font-weight:700;padding:12px 28px;border-radius:9999px;font-size:14px;">Open Betcheza</a>
          </p>
          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;text-align:center;">
            Bet smart. Bet small. 1–3% of bankroll per pick.<br/>
            If you didn't create this account, you can safely ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { text, html };
}

export async function POST(request: Request) {
  try {
    const ip = ipKeyFromHeaders(request.headers);
    // Tighter rate-limit on signup — 5 accounts per IP per hour stops spam
    // signup waves without affecting normal users.
    const ipLimit = rateLimit(`register:ip:${ip}`, 5, 60 * 60_000);
    if (!ipLimit.ok) {
      return NextResponse.json(
        { success: false, error: `Too many signups from this network. Try again in ${ipLimit.retryAfter}s.` },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfter ?? 60) } },
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, password, username, displayName, phone, countryCode, captchaToken, captchaId } = body;

    // Captcha is required for every signup to keep automated account creation
    // out. The provider (Turnstile / reCAPTCHA / math fallback) is decided
    // server-side in lib/captcha.ts.
    {
      const provider = getCaptchaProvider();
      let expected: string | undefined;
      if (provider === 'math') {
        expected = (captchaId ? recallMathAnswer(captchaId) : null) ?? undefined;
      }
      const v = await verifyCaptcha({ token: captchaToken, remoteIp: ip, expected });
      if (!v.ok) {
        return NextResponse.json(
          { success: false, error: v.error || 'Captcha required', captchaRequired: true },
          { status: 400 },
        );
      }
    }

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

    // Fire registration confirmation email via the admin-configured SMTP.
    // Don't block the response on it — wrap in try/catch so any SMTP issue
    // never fails registration. mailer.sendMail returns { skipped: true } if
    // SMTP isn't configured yet, and logs that so admins know to set it up.
    let emailStatus: 'sent' | 'skipped' | 'failed' = 'skipped';
    try {
      const origin =
        request.headers.get('origin') ||
        request.headers.get('referer')?.replace(/^(https?:\/\/[^/]+).*/, '$1') ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'https://betcheza.com';
      const appUrl = origin.replace(/\/$/, '');
      const { text, html } = buildRegistrationEmail({
        displayName: newUser.display_name,
        username: newUser.username,
        email: newUser.email,
        appUrl,
      });
      const res = await sendMail({
        to: newUser.email,
        subject: `Welcome to Betcheza, ${newUser.display_name} 🎯`,
        text,
        html,
      });
      if (res.ok) emailStatus = 'sent';
      else if (res.skipped) emailStatus = 'skipped';
      else emailStatus = 'failed';
    } catch (e) {
      console.error('[auth/register] welcome email failed:', e);
      emailStatus = 'failed';
    }

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
      emailStatus,
    });
  } catch (error) {
    console.error('[v0] Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
