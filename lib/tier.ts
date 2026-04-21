// Client-side mirror of the Postgres `public.tier(int)` function.
// Keep these thresholds in sync with the migration that defines the SQL version.
export function tier(rating: number | null | undefined): string {
  const r = rating ?? 0;
  if (r <= 50) return 'Unranked';
  if (r <= 200) return 'Bronze';
  if (r <= 400) return 'Silver';
  if (r <= 700) return 'Gold';
  if (r <= 1100) return 'Platinum';
  if (r <= 1600) return 'Diamond';
  return 'Master';
}
