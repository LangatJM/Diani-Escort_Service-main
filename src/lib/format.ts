export function formatKES(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return 'KES ' + new Intl.NumberFormat('en-KE').format(Math.round(safe));
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
