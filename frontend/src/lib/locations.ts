/** Keep canonical English values in URLs while making Hebrew labels readable. */
export function locationLabel(city: string, labels: Record<string, string> | string = {}): string {
  const translated = typeof labels === 'string' ? labels : labels[city];
  if (!translated || translated === city) return city;
  if (translated.toLocaleLowerCase().includes(city.toLocaleLowerCase())) return translated;
  return `${city} / ${translated}`;
}
