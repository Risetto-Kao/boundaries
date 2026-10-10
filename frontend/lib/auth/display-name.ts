// Only a display name is public. Never fall back to email or account IDs.
export function getAccountDisplayName(metadata: Record<string, unknown> | null | undefined) {
  for (const key of ["full_name", "name", "display_name"]) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 50);
  }
  return null;
}

export function resolveResponseNickname(nickname: unknown, metadata: Record<string, unknown> | null | undefined) {
  return nickname === undefined || (typeof nickname === "string" && !nickname.trim())
    ? getAccountDisplayName(metadata) ?? ""
    : nickname;
}
