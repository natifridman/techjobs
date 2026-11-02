import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, List, Map as MapIcon, MapPin, Search } from 'lucide-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/components/map/map-theme.css';
import ClusteredMarkers from '@/components/map/ClusteredMarkers';
import { CITY_COORDS } from '@/components/map/cityCoords';
import { useJobsCatalog } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CatalogFreshness from '@/components/CatalogFreshness';
import { locationLabel } from '@/lib/locations';

const EMPTY_LABELS: Record<string, string> = {};
function findCityCoords(city: string): [number, number] | null {
  // Never turn a partial city name into a pin in a different place.
  return Object.entries(CITY_COORDS).find(([name]) => name.toLowerCase() === city.toLowerCase())?.[1] || null;
}
function FitBounds({ cities, view }: { cities: { coords: [number, number] }[]; view: string }) {
  const map = useMap();
  useEffect(() => {
    const fit = () => {
      map.invalidateSize?.();
      if (cities.length)
        map.fitBounds(L.latLngBounds(cities.map((city) => city.coords)), { padding: [40, 40], maxZoom: 11 });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [cities, map, view]);
  return null;
}
export default function Map() {
  const { data, isLoading, isError, refetch } = useJobsCatalog();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [tileError, setTileError] = useState(false);
  const [tileAttempt, setTileAttempt] = useState(0);
  const labels = data?.cityLabels || EMPTY_LABELS;
  const cities = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (data?.cities || []).filter(
      (city) => !query || locationLabel(city.city, labels).toLocaleLowerCase().includes(query),
    );
  }, [data, labels, search]);
  const mappedCities = useMemo(
    () =>
      cities.flatMap((city) => {
        const coords = findCityCoords(city.city);
        return coords ? [{ ...city, coords }] : [];
      }),
    [cities],
  );
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="eyebrow mb-2">Opportunity, mapped</p>
      <h1 className="text-3xl font-bold tracking-tight text-ink">Explore jobs by location</h1>
      <p className="mt-2 text-muted">
        Find a team nearby. Search in English or Hebrew, then explore its open roles.
      </p>
      {data && (
        <>
          <p className="mt-4 text-sm text-muted">
            {data.stats.jobs.toLocaleString()} open jobs · {data.stats.companies.toLocaleString()} companies ·{' '}
            {data.stats.cities.toLocaleString()} locations
          </p>
          <CatalogFreshness updatedAt={data.updatedAt} stale={data.stale || isError} className="mt-2" />
        </>
      )}
      {isError && data && (
        <div
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-warning"
          role="status"
        >
          Could not refresh locations. Showing the last loaded catalog.
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}
      {isLoading ? (
        <div
          className="mt-7 flex h-96 items-center justify-center rounded-xl border border-border bg-surface text-muted"
          role="status"
        >
          Loading locations…
        </div>
      ) : isError && !data ? (
        <div className="mt-7 rounded-xl border border-border bg-surface p-10 text-center" role="alert">
          <h2 className="text-lg font-semibold">Locations could not be loaded</h2>
          <p className="mb-5 mt-2 text-muted">Please check your connection and try again.</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex gap-2 lg:hidden" role="tablist" aria-label="Location view">
            <button
              id="location-list-tab"
              role="tab"
              aria-selected={view === 'list'}
              aria-controls="location-list"
              tabIndex={view === 'list' ? 0 : -1}
              onClick={() => setView('list')}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'End') {
                  setView('map');
                  document.getElementById('location-map-tab')?.focus();
                }
              }}
              className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium ${view === 'list' ? 'bg-action text-action-foreground' : 'bg-surface text-muted'}`}
            >
              <List className="h-4 w-4" aria-hidden="true" />
              List
            </button>
            <button
              id="location-map-tab"
              role="tab"
              aria-selected={view === 'map'}
              aria-controls="location-map"
              tabIndex={view === 'map' ? 0 : -1}
              onClick={() => setView('map')}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft' || event.key === 'Home') {
                  setView('list');
                  document.getElementById('location-list-tab')?.focus();
                }
              }}
              className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium ${view === 'map' ? 'bg-action text-action-foreground' : 'bg-surface text-muted'}`}
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" />
              Map
            </button>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-[21rem_minmax(0,1fr)]">
            <section
              id="location-list"
              className={`${view === 'list' ? '' : 'hidden'} overflow-hidden rounded-2xl border border-border bg-surface lg:block`}
              aria-labelledby="city-list-title"
            >
              <div className="border-b border-border p-4">
                <h2 id="city-list-title" className="font-semibold text-ink">
                  Browse locations
                </h2>
                <div className="relative mt-3">
                  <label htmlFor="city-search" className="sr-only">
                    Search cities in English or Hebrew
                  </label>
                  <Search
                    className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted"
                    aria-hidden="true"
                  />
                  <Input
                    id="city-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search locations"
                    className="pl-9"
                  />
                </div>
                <p className="mt-3 text-xs text-muted" role="status">
                  {cities.length} {cities.length === 1 ? 'location' : 'locations'}
                </p>
              </div>
              <ul
                className="divide-y divide-border lg:max-h-[31rem] lg:overflow-y-auto"
                aria-label="Locations with open jobs"
              >
                {cities.map((city) => (
                  <li key={city.city}>
                    <Link
                      to={`/jobs?city=${encodeURIComponent(city.city)}`}
                      className="group flex min-h-20 items-center gap-3 px-4 py-3 hover:bg-page"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <bdi className="block font-medium text-ink">{locationLabel(city.city, labels)}</bdi>
                        <span className="mt-1 block text-xs text-muted">
                          {city.jobCount.toLocaleString()} jobs · {city.companies.length}{' '}
                          {city.companies.length === 1 ? 'company' : 'companies'}
                        </span>
                      </span>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-muted group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
              {cities.length === 0 && (
                <div className="p-6 text-sm text-muted">
                  No matching locations.
                  {search && (
                    <Button variant="link" onClick={() => setSearch('')}>
                      Clear search
                    </Button>
                  )}
                </div>
              )}
            </section>
            <section
              id="location-map"
              aria-label="Map of jobs in Israeli cities"
              aria-describedby="map-help"
              className={`${view === 'map' ? '' : 'hidden'} relative z-0 h-[26rem] overflow-hidden rounded-2xl border border-border bg-surface lg:block lg:h-[40rem]`}
            >
              {tileError ? (
                <div
                  role="status"
                  className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"
                >
                  <MapIcon className="h-10 w-10 text-muted" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-ink">The map is temporarily unavailable</h2>
                  <p className="max-w-xs text-sm text-muted">
                    You can still explore every location in the list.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      onClick={() => {
                        setTileError(false);
                        setTileAttempt((value) => value + 1);
                      }}
                    >
                      Retry map
                    </Button>
                    <Button
                      variant="outline"
                      className="lg:hidden"
                      onClick={() => {
                        setView('list');
                        document.getElementById('location-list-tab')?.focus();
                      }}
                    >
                      Use location list
                    </Button>
                  </div>
                </div>
              ) : (
                <MapContainer
                  key={tileAttempt}
                  center={[31.5, 34.75]}
                  zoom={8}
                  className="jobs-map"
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    referrerPolicy="strict-origin"
                    eventHandlers={{ tileerror: () => setTileError(true) }}
                  />
                  <FitBounds cities={mappedCities} view={view} />
                  <ClusteredMarkers cities={mappedCities} labels={labels} />
                </MapContainer>
              )}
            </section>
          </div>
          <p id="map-help" className="mt-4 text-xs leading-5 text-muted">
            Clusters show the number of locations; individual pins show open jobs. The keyboard-accessible
            list includes locations without map coordinates. Multi-location roles count in each relevant
            location.
          </p>
        </>
      )}
    </div>
  );
}
