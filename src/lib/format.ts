export function formatKES(amount: number): string {
  return 'KES ' + new Intl.NumberFormat('en-KE').format(Math.round(amount));
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
