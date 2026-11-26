// In-memory login throttling, keyed by caller + username.
//
// Note: this state lives in a single server process's memory. That's fine for
// a single Next.js server (e.g. `next start`, a single long-running
// container/VM), but it will NOT share state across multiple serverless
// instances/regions. If you deploy to a multi-instance platform, replace this
// with a shared store (e.g. a `login_attempts` table in Supabase, or Redis).

interface Attempt {
  count: number
  firstAttemptAt: number
  lockedUntil?: number
}

const MAX_ATTEMPTS = 5
const WINDOW_MS = 10 * 60 * 1000 // failures older than this don't count toward the limit
const LOCKOUT_MS = 15 * 60 * 1000 // how long an account+caller is locked out after too many failures

const attempts = new Map<string, Attempt>()

function prune(now: number) {
  for (const [key, a] of attempts) {
    const stillLocked = a.lockedUntil !== undefined && a.lockedUntil > now
    const withinWindow = now - a.firstAttemptAt <= WINDOW_MS
    if (!stillLocked && !withinWindow) attempts.delete(key)
  }
}

export function checkLoginLock(key: string): { locked: boolean; retryAfterSeconds?: number } {
  const now = Date.now()
  const a = attempts.get(key)
  if (a?.lockedUntil && a.lockedUntil > now) {
    return { locked: true, retryAfterSeconds: Math.ceil((a.lockedUntil - now) / 1000) }
  }
  return { locked: false }
}

export function recordLoginFailure(key: string): void {
  const now = Date.now()
  prune(now)

  const existing = attempts.get(key)
  if (!existing || now - existing.firstAttemptAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttemptAt: now })
    return
  }

  existing.count += 1
  if (existing.count >= MAX_ATTEMPTS) {
    existing.lockedUntil = now + LOCKOUT_MS
  }
}

export function recordLoginSuccess(key: string): void {
  attempts.delete(key)
}

// Best-effort client identifier for throttling (works behind most proxies/CDNs).
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
