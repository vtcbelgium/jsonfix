export interface RepairResult {
  valid: boolean;
  repairedText: string;
  originalText: string;
  error?: string;
  line?: number;
  column?: number;
}

export function repairJsonString(raw: string): string {
  if (!raw || !raw.trim()) return "";

  let s = raw.trim();

  // Strip trailing semicolon if present
  s = s.replace(/;\s*$/, "");

  // Normalize Python-style booleans and None
  s = s.replace(/\bTrue\b/g, "true");
  s = s.replace(/\bFalse\b/g, "false");
  s = s.replace(/\bNone\b/g, "null");

  // Replace single-quoted string values/keys with double-quoted ones
  // Handles strings with escaped single quotes
  s = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_m, content) => {
    return '"' + content.replace(/"/g, '\\"').replace(/\\'/g, "'") + '"';
  });

  // Quote unquoted object keys (e.g. { foo: "bar" } -> { "foo": "bar" })
  s = s.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');

  // Remove trailing commas before closing braces/brackets
  s = s.replace(/,\s*([}\]])/g, "$1");

  return s;
}

export function parseAndRepairJson(input: string): RepairResult {
  if (!input || !input.trim()) {
    return {
      valid: false,
      repairedText: "",
      originalText: input,
      error: "Input is empty",
    };
  }

  // First check if already valid
  try {
    const parsed = JSON.parse(input);
    return {
      valid: true,
      repairedText: JSON.stringify(parsed, null, 2),
      originalText: input,
    };
  } catch {
    // Attempt automated repair
    const repaired = repairJsonString(input);
    try {
      const parsed = JSON.parse(repaired);
      return {
        valid: true,
        repairedText: JSON.stringify(parsed, null, 2),
        originalText: input,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        valid: false,
        repairedText: repaired,
        originalText: input,
        error: msg,
      };
    }
  }
}
