import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/components/map/map-theme.css';
import { CITY_COORDS } from '@/components/map/cityCoords';
import { useJobsCatalog } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CatalogFreshness from '@/components/CatalogFreshness';

const createCustomIcon = (count: number) => {
  const size = Math.min(52, Math.max(44, 24 + Math.log(Math.max(count, 1)) * 4));
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="job-count-marker" style="width:${size}px;height:${size}px">${count}</div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
};

// Prefer exact canonical names. The longest fallback keeps Or Yehuda distinct from Yehud.
function findCityCoords(city: string): [number, number] | null {
  const needle = city.toLowerCase();
  const entries = Object.entries(CITY_COORDS);
  const exact = entries.find(([name]) => name.toLowerCase() === needle);
  if (exact) return exact[1];
  const matches = entries.filter(([name]) => needle.includes(name.toLowerCase()) || name.toLowerCase().includes(needle));
  matches.sort((a, b) => b[0].length - a[0].length);
  return matches[0]?.[1] || null;
}

function FitBounds({ cities }: { cities: { coords: [number, number] }[] }) {
  const map = useMap();
  useEffect(() => {
    if (cities.length) map.fitBounds(L.latLngBounds(cities.map(city => city.coords)), { padding: [40, 40], maxZoom: 11 });
  }, [cities, map]);
  return null;
}

export default function Map() {
  const { data, isLoading, isError, refetch } = useJobsCatalog();
  const [search, setSearch] = useState('');
  const cities = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (data?.cities || []).filter(city => !query || `${city.city} ${data?.cityLabels[city.city] || ''}`.toLocaleLowerCase().includes(query));
  }, [data, search]);
  const mappedCities = useMemo(() => cities.flatMap(city => {
    const coords = findCityCoords(city.city);
    return coords ? [{ ...city, coords }] : [];
  }), [cities]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink">Explore jobs by location</h1>
      <p className="mt-2 text-muted">Choose a city from the list or map to see its open roles.</p>
      {data && <><p className="mt-4 text-sm text-muted">{data.stats.jobs.toLocaleString()} open jobs · {data.stats.companies.toLocaleString()} companies · {data.stats.cities.toLocaleString()} cities</p><CatalogFreshness updatedAt={data.updatedAt} stale={data.stale || isError} className="mt-2" /></>}
      {isError && data && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-warning" role="status">Could not refresh locations. Showing the last loaded catalog.<Button variant="outline" onClick={() => refetch()}>Retry</Button></div>}
      {isLoading ? <div className="mt-7 flex h-96 items-center justify-center rounded-xl border border-border bg-surface text-muted" role="status">Loading locations…</div> : isError && !data ? <div className="mt-7 rounded-xl border border-border bg-surface p-10 text-center" role="alert"><h2 className="text-lg font-semibold">Locations could not be loaded</h2><p className="mb-5 mt-2 text-muted">Please check your connection and try again.</p><Button onClick={() => refetch()}>Retry</Button></div> : <>
        <div className="mt-7 grid gap-5 lg:grid-cols-[21rem_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-xl border border-border bg-surface" aria-labelledby="city-list-title">
            <div className="border-b border-border p-4"><h2 id="city-list-title" className="font-semibold text-ink">Browse cities</h2><div className="relative mt-3"><label htmlFor="city-search" className="sr-only">Search cities in English or Hebrew</label><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" /><Input id="city-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search cities" className="pl-9" /></div><p className="mt-3 text-xs text-muted" role="status">{cities.length} {cities.length === 1 ? 'city' : 'cities'}</p></div>
            <ul className="max-h-80 divide-y divide-border overflow-y-auto lg:max-h-[31rem]" aria-label="Cities with open jobs">
              {cities.map(city => <li key={city.city}><Link to={`/jobs?city=${encodeURIComponent(city.city)}`} className="group flex min-h-20 items-center gap-3 px-4 py-3 hover:bg-warm-50"><MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block font-medium text-ink"><bdi dir="auto">{data?.cityLabels[city.city] || city.city}</bdi></span><span className="mt-1 block text-xs text-muted">{city.jobCount.toLocaleString()} jobs · {city.companies.length} companies</span></span><ArrowRight className="h-4 w-4 shrink-0 text-muted group-hover:text-primary" aria-hidden="true" /></Link></li>)}
            </ul>
            {cities.length === 0 && <div className="p-6 text-sm text-muted">No matching cities.{search && <Button variant="link" onClick={() => setSearch('')}>Clear search</Button>}</div>}
          </section>
          <section aria-label="Map of jobs in Israeli cities" aria-describedby="map-help" className="relative z-0 h-[26rem] overflow-hidden rounded-xl border border-border bg-surface lg:h-[40rem]">
            <MapContainer center={[31.5, 34.75]} zoom={8} className="jobs-map" style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FitBounds cities={mappedCities} />
              {mappedCities.map(city => <Marker key={city.city} position={city.coords} icon={createCustomIcon(city.jobCount)} title={`${city.city}: ${city.jobCount} open jobs`} alt={`${city.city}: ${city.jobCount} open jobs`}>
                <Popup><div><h2 className="text-base font-semibold text-ink"><bdi dir="auto">{data?.cityLabels[city.city] || city.city}</bdi></h2><p className="text-sm text-muted">{city.jobCount.toLocaleString()} jobs at {city.companies.length} companies</p><Link to={`/jobs?city=${encodeURIComponent(city.city)}`} className="inline-flex min-h-11 items-center font-medium !text-primary">View jobs in {city.city} →</Link></div></Popup>
              </Marker>)}
            </MapContainer>
          </section>
        </div>
        <p id="map-help" className="mt-4 text-xs text-muted">The city list contains the same location summaries as the map and can be used with a keyboard. A role with several locations is counted in each relevant city.</p>
      </>}
    </div>
  );
}
