import type { Filters } from './filters';
// Canonical job-feed area map. Areas are not administrative districts.
export const CITY_AREAS: Record<string, string> = {
  "Tel Aviv": "tel-aviv-gush-dan",
  "Ramat Gan": "tel-aviv-gush-dan",
  "Givatayim": "tel-aviv-gush-dan",
  "Bnei Brak": "tel-aviv-gush-dan",
  "Holon": "tel-aviv-gush-dan",
  "Bat Yam": "tel-aviv-gush-dan",
  "Or Yehuda": "tel-aviv-gush-dan",
  "Kiryat Ono": "tel-aviv-gush-dan",
  "Herzliya": "sharon",
  "Ramat HaSharon": "sharon",
  "Ra'anana": "sharon",
  "Kfar Saba": "sharon",
  "Hod HaSharon": "sharon",
  "Netanya": "sharon",
  "Kfar Netter": "sharon",
  "Shefayim": "sharon",
  "Caesarea": "sharon",
  "Magal": "sharon",
  "Petah Tikva": "center",
  "Rosh HaAyin": "center",
  "Yehud": "center",
  "Modi'in": "center",
  "Ben Gurion Airport": "center",
  "Rishon LeZion": "center",
  "Central District": "center",
  "Rehovot": "shfela",
  "Ness Ziona": "shfela",
  "Yavne": "shfela",
  "Ramla": "shfela",
  "Lod": "shfela",
  "Beer Yaakov": "shfela",
  "Shfela": "shfela",
  "Jerusalem": "jerusalem",
  "Beit Shemesh": "jerusalem",
  "Haifa": "haifa-krayot",
  "Kiryat Bialik": "haifa-krayot",
  "Yokneam": "haifa-krayot",
  "Karmiel": "north",
  "Nazareth": "north",
  "Afula": "north",
  "Acre": "north",
  "Zefat": "north",
  "Kiryat Shmona": "north",
  "Tiberias": "north",
  "Katzrin": "north",
  "Yizre'el": "north",
  "Migdal HaEmek": "north",
  "Ramat HaGolan": "north",
  "Dalton": "north",
  "Sha'ar HaGolan": "north",
  "Beit HaEmek": "north",
  "Northern District": "north",
  "Ashdod": "south",
  "Ashkelon": "south",
  "Sderot": "south",
  "Kiryat Gat": "south",
  "Southern District": "south",
  "Beer Sheva": "negev",
  "Dimona": "negev",
  "Eilat": "negev",
  "Ariel": "judea-samaria"
};
export function citiesInArea(area: string, available: string[]): string[] {
  return available.filter(city => CITY_AREAS[city] === area);
}
export function needsLegacyLocationConsent(filters: Filters, available: string[]): boolean {
  return filters.regions.length > 0 && (filters.cities.length > 0 || filters.regions.some(area => citiesInArea(area, available).length === 0));
}
export function selectedCities(filters: Filters, available: string[]): string[] {
  return [...new Set([...filters.cities, ...filters.regions.flatMap(area => citiesInArea(area, available))])];
}
export function toggleArea(filters: Filters, area: string, available: string[]): Filters {
  if (needsLegacyLocationConsent(filters, available)) return filters;
  const members = citiesInArea(area, available);
  const current = selectedCities(filters, available);
  const all = members.length > 0 && members.every(city => current.includes(city));
  return { ...filters, regions: [], cities: all ? current.filter(city => !members.includes(city)) : [...new Set([...current, ...members])] };
}
export function toggleCity(filters: Filters, city: string, available: string[]): Filters {
  if (needsLegacyLocationConsent(filters, available)) return filters;
  const current = selectedCities(filters, available);
  return { ...filters, regions: [], cities: current.includes(city) ? current.filter(item => item !== city) : [...current, city] };
}

export function switchToCitySelection(filters: Filters, available: string[]): Filters {
  // An explicit city list stays intact; region-only links seed the mapped cities.
  return { ...filters, cities: filters.cities.length ? filters.cities : selectedCities(filters, available), regions: [] };
}
