export function addDays(d: Date, days: number) {
  const t = new Date(d.getTime());
  t.setDate(t.getDate() + days);
  return t.toISOString().slice(0, 19).replace('T',' ');
}
