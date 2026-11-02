import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { locationLabel } from '@/lib/locations';

type MappedLocation = { city: string; jobCount: number; companies: string[]; coords: [number, number] };
export default function ClusteredMarkers({
  cities,
  labels,
}: {
  cities: MappedLocation[];
  labels: Record<string, string>;
}) {
  const map = useMap();
  useEffect(() => {
    const clusters = L.markerClusterGroup({
      maxClusterRadius: 56,
      showCoverageOnHover: false,
      animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          className: 'location-cluster',
          html: `<span>${cluster.getChildCount()}</span><small>locations</small>`,
          iconSize: [60, 60],
        }),
    });
    for (const city of cities) {
      const name = locationLabel(city.city, labels);
      const content = document.createElement('div');
      const title = document.createElement('h2');
      title.className = 'text-base font-semibold text-ink';
      title.textContent = name;
      const summary = document.createElement('p');
      summary.className = 'text-sm text-muted';
      summary.textContent = `${city.jobCount.toLocaleString()} jobs at ${city.companies.length} ${city.companies.length === 1 ? 'company' : 'companies'}`;
      const link = document.createElement('a');
      link.href = `/jobs?city=${encodeURIComponent(city.city)}`;
      link.className = 'inline-flex min-h-11 items-center font-medium';
      link.textContent = `View jobs in ${name} →`;
      content.append(title, summary, link);
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="job-count-marker" style="width:48px;height:48px">${city.jobCount.toLocaleString()}</div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });
      clusters.addLayer(
        L.marker(city.coords, {
          icon,
          title: `${name}: ${city.jobCount} open jobs`,
          alt: `${name}: ${city.jobCount} open jobs`,
        }).bindPopup(content),
      );
    }
    map.addLayer(clusters);
    return () => {
      map.removeLayer(clusters);
      clusters.clearLayers();
    };
  }, [cities, labels, map]);
  return null;
}
