import nodemailer, { type Transporter } from 'nodemailer';
import { getEmailConfig, type EmailConfig } from './email-config-store';

let cached: { cfg: EmailConfig; transporter: Transporter } | null = null;

async function getTransporter(): Promise<{ cfg: EmailConfig; transporter: Transporter } | null> {
  const cfg = await getEmailConfig();
  if (!cfg.enabled || !cfg.host || !cfg.username || !cfg.password) {
    return null;
  }
  if (
    cached &&
    cached.cfg.host === cfg.host &&
    cached.cfg.port === cfg.port &&
    cached.cfg.secure === cfg.secure &&
    cached.cfg.username === cfg.username &&
    cached.cfg.password === cfg.password
  ) {
    return cached;
  }
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.username, pass: cfg.password },
  });
  cached = { cfg, transporter };
  return cached;
}

export interface SendMailInput {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export interface SendMailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const ctx = await getTransporter();
  if (!ctx) {
    console.warn('[mailer] SMTP not configured — skipping send to', input.to);
    return { ok: false, skipped: true, error: 'SMTP not configured' };
  }
  try {
    const info = await ctx.transporter.sendMail({
      from: ctx.cfg.fromName ? `${ctx.cfg.fromName} <${ctx.cfg.fromEmail}>` : ctx.cfg.fromEmail,
      to: Array.isArray(input.to) ? input.to.join(',') : input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo || ctx.cfg.replyTo || undefined,
    });
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[mailer] send failed:', msg);
    return { ok: false, error: msg };
  }
}

export async function verifyMailer(): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getTransporter();
  if (!ctx) return { ok: false, error: 'SMTP not configured' };
  try {
    await ctx.transporter.verify();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function sendBulkMail(
  recipients: string[],
  subject: string,
  html: string,
  text?: string
): Promise<{ sent: number; failed: number; skipped?: boolean }> {
  const ctx = await getTransporter();
  if (!ctx) return { sent: 0, failed: 0, skipped: true };
  let sent = 0;
  let failed = 0;
  // Send sequentially with a tiny delay so we don't blow through SMTP rate limits.
  for (const to of recipients) {
    const res = await sendMail({ to, subject, html, text });
    if (res.ok) sent++;
    else failed++;
    await new Promise((r) => setTimeout(r, 80));
  }
  return { sent, failed };
}
