export function pyString(value: string): string {
  return JSON.stringify(value).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export function safePythonIdentifier(value: string): string {
  const ascii = value
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  const base = ascii || "screen";
  return /^[0-9]/.test(base) ? `screen_${base}` : base;
}
