export const JOIN_CODE_RE = /^MKT-[A-Z0-9]{4}$/;

export function normalizeJoinCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s/g, "");
}

export function isValidJoinCode(code: string): boolean {
  return JOIN_CODE_RE.test(code);
}
