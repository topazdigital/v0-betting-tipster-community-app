// Captcha verification helper.
//
// We support two captcha providers, both optional:
//   1. Cloudflare Turnstile (preferred — privacy-friendly, free, no PII).
//   2. Google reCAPTCHA v2 / v3.
//
// Either is enabled by setting the matching site key on the public env and
// the secret on the server env. When neither is configured we fall back to a
// simple server-issued math captcha (`/api/captcha/challenge` + answer) so
// the login flow still has *some* bot-mitigation even in fresh installs.

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'

export type CaptchaProvider = 'turnstile' | 'recaptcha' | 'math' | 'none'

export function getCaptchaProvider(): CaptchaProvider {
  if (process.env.TURNSTILE_SECRET_KEY) return 'turnstile'
  if (process.env.RECAPTCHA_SECRET_KEY) return 'recaptcha'
  // Math captcha is always available — built into our challenge endpoint.
  return 'math'
}

/**
 * Public-facing captcha config — safe to expose to the browser. The auth
 * modal calls /api/captcha/config to know which widget to render.
 */
export function getPublicCaptchaConfig() {
  const provider = getCaptchaProvider()
  return {
    provider,
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
      || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      || null,
  }
}

/**
 * Verify a captcha token against the configured provider. Returns true when
 * the token is genuine and recent.
 *
 * For the 'math' provider, the `token` is the user's typed answer and
 * `expected` is the answer we issued and stored in the challenge cookie / store.
 */
export async function verifyCaptcha(opts: {
  token: string | null | undefined
  remoteIp?: string
  /** Only used for the 'math' provider. */
  expected?: string
}): Promise<{ ok: boolean; error?: string }> {
  const provider = getCaptchaProvider()
  const token = (opts.token || '').trim()
  if (!token) return { ok: false, error: 'Captcha required' }

  if (provider === 'turnstile') {
    try {
      const body = new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY || '',
        response: token,
      })
      if (opts.remoteIp) body.set('remoteip', opts.remoteIp)
      const res = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body })
      const data = await res.json().catch(() => ({})) as { success?: boolean; 'error-codes'?: string[] }
      if (data.success) return { ok: true }
      return { ok: false, error: 'Captcha verification failed' }
    } catch {
      return { ok: false, error: 'Captcha provider unreachable' }
    }
  }

  if (provider === 'recaptcha') {
    try {
      const body = new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY || '',
        response: token,
      })
      if (opts.remoteIp) body.set('remoteip', opts.remoteIp)
      const res = await fetch(RECAPTCHA_VERIFY_URL, { method: 'POST', body })
      const data = await res.json().catch(() => ({})) as { success?: boolean; score?: number }
      if (data.success && (data.score === undefined || data.score >= 0.4)) return { ok: true }
      return { ok: false, error: 'Captcha verification failed' }
    } catch {
      return { ok: false, error: 'Captcha provider unreachable' }
    }
  }

  // Math captcha — token is the user-typed answer, expected is the answer we
  // signed and gave them. Compare in constant time.
  if (provider === 'math') {
    const exp = (opts.expected || '').trim()
    if (!exp) return { ok: false, error: 'Captcha expired' }
    if (token.length === exp.length && safeEqual(token, exp)) return { ok: true }
    return { ok: false, error: 'Wrong captcha answer' }
  }

  return { ok: true }
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Generate a fresh math challenge — server-issued, non-guessable. */
export function generateMathChallenge(): { id: string; question: string; answer: string } {
  const a = 2 + Math.floor(Math.random() * 8)
  const b = 2 + Math.floor(Math.random() * 8)
  const op = Math.random() < 0.5 ? '+' : '-'
  const answer = String(op === '+' ? a + b : Math.abs(a - b))
  const question = `${Math.max(a, b)} ${op === '+' ? '+' : '-'} ${Math.min(a, b)}`
  // Random id so the answer can't be guessed without storing it server-side.
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36)
  return { id, question, answer }
}

// In-memory store for math challenges (TTL 10 min). For multi-process
// deployments swap for Redis / DB — but for a single Next.js node this is
// perfectly adequate and avoids extra infra.
const MATH_STORE = new Map<string, { answer: string; expires: number }>()

export function rememberMathAnswer(id: string, answer: string) {
  MATH_STORE.set(id, { answer, expires: Date.now() + 10 * 60_000 })
  // Best-effort GC: keep the map small.
  if (MATH_STORE.size > 5000) {
    const now = Date.now()
    for (const [k, v] of MATH_STORE) {
      if (v.expires < now) MATH_STORE.delete(k)
    }
  }
}

export function recallMathAnswer(id: string): string | null {
  const v = MATH_STORE.get(id)
  if (!v) return null
  if (v.expires < Date.now()) {
    MATH_STORE.delete(id)
    return null
  }
  // Single-use — burn after recall.
  MATH_STORE.delete(id)
  return v.answer
}
