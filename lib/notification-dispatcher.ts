// Sends an in-app + push + email notification, respecting user preferences.
// Used by the match-reminders cron and any future notification trigger.

import { createNotification, getPreferences, listPushSubscriptions, listEmailSubscribers } from './notification-store';
import { sendMail } from './mailer';

interface DispatchInput {
  userId: number;
  email?: string | null;
  type: 'team_match_starting' | 'team_result' | 'tipster_new_tip' | 'system';
  title: string;
  content: string;
  link?: string | null;
}

export async function dispatchNotification(input: DispatchInput): Promise<void> {
  const prefs = await getPreferences(input.userId);

  // 1. Always create an in-app notification (unless user disabled team
  //    updates for that family).
  const teamRelated = input.type === 'team_match_starting' || input.type === 'team_result';
  const wantsInApp = teamRelated ? prefs.inappTeamUpdates : true;
  if (wantsInApp) {
    await createNotification({
      userId: input.userId,
      type: input.type,
      title: input.title,
      content: input.content,
      link: input.link || null,
      channel: 'inapp',
    });
  }

  // 2. Push (only if user has subscribed and prefs allow).
  if (prefs.pushTeamUpdates) {
    try {
      const subs = await listPushSubscriptions(input.userId);
      for (const sub of subs) {
        await sendBrowserPush(sub.endpoint, input.title, input.content, input.link || '/');
      }
    } catch (e) {
      console.warn('[notify] push dispatch failed', e);
    }
  }

  // 3. Email (best-effort).
  const wantsEmail = teamRelated ? prefs.emailTeamUpdates : false;
  if (wantsEmail && input.email) {
    try {
      await sendMail({
        to: input.email,
        subject: input.title,
        text: `${input.content}${input.link ? `\n\nView: ${input.link}` : ''}`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:560px;padding:16px">
          <h2 style="margin:0 0 8px 0;color:#0ea5e9">${escapeHtml(input.title)}</h2>
          <p style="color:#334155;line-height:1.5">${escapeHtml(input.content)}</p>
          ${input.link ? `<p><a href="${escapeHtml(input.link)}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open BetTips Pro</a></p>` : ''}
          <p style="color:#94a3b8;font-size:12px;margin-top:24px">You can manage your reminders in the BetTips Pro app.</p>
        </div>`,
      });
    } catch (e) {
      console.warn('[notify] email send failed', e);
    }
  }

  void listEmailSubscribers; // keep import alive for future broadcast use
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

async function sendBrowserPush(endpoint: string, _title: string, _body: string, _link: string): Promise<void> {
  // We don't have a VAPID-signed web-push pipeline configured (no
  // `web-push` dependency). To keep this lightweight and dependency-free
  // we simply log the intent — when the user adds VAPID keys, hook the
  // real `web-push` library in here.
  if (process.env.DEBUG_NOTIFY) {
    console.log('[notify] would send push to', endpoint.slice(0, 64) + '…');
  }
}
