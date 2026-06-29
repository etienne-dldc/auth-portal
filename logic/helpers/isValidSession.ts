export function isSessionValid<T extends { expiresAt: Temporal.Instant }>(
  session: T | null,
): session is T {
  if (!session) {
    return false;
  }
  const sessionExpired = Temporal.Now.instant().epochMilliseconds >
    session.expiresAt.epochMilliseconds;
  return !sessionExpired;
}
