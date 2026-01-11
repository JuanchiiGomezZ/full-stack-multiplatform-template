/**
 * Format a date to a specific format string
 * Supports: dd, MM, yyyy, HH, mm, ss
 */
export function formatDate(date: Date, format: string): string {
  const pad = (n: number) => n.toString().padStart(2, "0");

  const tokens: Record<string, string> = {
    dd: pad(date.getDate()),
    MM: pad(date.getMonth() + 1),
    yyyy: date.getFullYear().toString(),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };

  return format.replace(/dd|MM|yyyy|HH|mm|ss/g, (match) => tokens[match] || match);
}
