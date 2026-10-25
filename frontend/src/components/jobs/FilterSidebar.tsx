import { useId, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EMPTY_FILTERS, WORK_MODELS, EMPLOYMENT_TYPES, SENIORITIES, activeFilterCount, type Filters, type ListFilter } from './filters';
import { REGION_LABELS, CATEGORY_LABELS } from './jobsData';

interface FilterSidebarProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  cities: string[];
  cityLabels?: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

function FilterFields({ filters, setFilters, cities, cityLabels = {} }: Pick<FilterSidebarProps, 'filters' | 'setFilters' | 'cities' | 'cityLabels'>) {
  const id = useId();
  const [citySearch, setCitySearch] = useState('');
  const toggle = (key: ListFilter, value: string) => setFilters(previous => ({
    ...previous, [key]: previous[key].includes(value) ? previous[key].filter(item => item !== value) : [...previous[key], value],
  }));
  const group = (title: string, key: ListFilter, values: string[], label: (value: string) => string = value => value.replace(/-/g, ' '), open = false) => (
    <details className="group border-b border-warm-100 py-4" open={open}>
      <summary className="flex min-h-11 sm:min-h-8 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-warm-800">
        <span>{title}{filters[key].length > 0 && <span className="ml-2 text-xs font-normal text-iris-700">{filters[key].length}</span>}</span>
        <ChevronDown className="h-4 w-4 text-warm-400 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      {key === 'cities' && <div className="relative mt-3"><Search className="absolute left-2.5 top-3 h-4 w-4 text-warm-400" aria-hidden="true" /><Input value={citySearch} onChange={event => setCitySearch(event.target.value)} placeholder="Find a city" aria-label="Find a city" className="h-10 pl-8 text-sm" /></div>}
      <div className={`mt-2 space-y-1 ${values.length > 9 ? 'max-h-56 overflow-y-auto pr-1' : ''}`}>
        {values.map(value => <div key={value} className="flex min-h-11 sm:min-h-9 items-center gap-2.5">
          <Checkbox id={`${id}-${key}-${value}`} checked={filters[key].includes(value)} onCheckedChange={() => toggle(key, value)} />
          <Label htmlFor={`${id}-${key}-${value}`} className="flex-1 cursor-pointer py-1.5 text-sm font-normal capitalize text-warm-600">{label(value)}</Label>
        </div>)}
        {values.length === 0 && <p className="py-2 text-sm text-warm-500">No matching cities</p>}
      </div>
    </details>
  );
  const matchingCities = cities.filter(city => `${city} ${cityLabels[city] || ''}`.toLowerCase().includes(citySearch.toLowerCase()));
  return <>
    {group('Job category', 'jobCategories', Object.keys(CATEGORY_LABELS), value => CATEGORY_LABELS[value] || value, true)}
    {group('Work model', 'workModels', WORK_MODELS, undefined, true)}
    {group('City', 'cities', matchingCities, value => cityLabels[value] || value, true)}
    {group('Region', 'regions', Object.keys(REGION_LABELS), value => REGION_LABELS[value] || value)}
    {group('Employment type', 'employmentTypes', EMPLOYMENT_TYPES)}
    {group('Seniority', 'seniorities', SENIORITIES)}
    <div className="flex items-start gap-2.5 py-5">
      <Checkbox id={`${id}-closed`} checked={filters.showClosed} onCheckedChange={checked => setFilters(previous => ({ ...previous, showClosed: checked === true }))} className="mt-0.5" />
      <Label htmlFor={`${id}-closed`} className="text-sm font-normal leading-5 text-warm-600">Include closed jobs</Label>
    </div>
  </>;
}

function MobileFilters({ filters, setFilters, cities, cityLabels, onClose }: FilterSidebarProps) {
  const [draft, setDraft] = useState(filters);
  return <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/60" />
    <Dialog.Content onCloseAutoFocus={event => { event.preventDefault(); document.querySelector<HTMLButtonElement>('[data-job-filter-trigger]')?.focus(); }} className="fixed inset-y-0 left-0 z-50 flex h-dvh w-full max-w-md flex-col bg-surface shadow-xl focus:outline-none">
      <div className="flex items-center justify-between border-b border-warm-200 px-5 py-4">
        <div><Dialog.Title className="text-lg font-semibold text-warm-900">Filter jobs</Dialog.Title><Dialog.Description className="mt-0.5 text-xs text-warm-500">Choose filters, then show your results.</Dialog.Description></div>
        <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Cancel filter changes"><X className="h-5 w-5" /></Button></Dialog.Close>
      </div>
      <div className="flex-1 overflow-y-auto px-5"><FilterFields filters={draft} setFilters={setDraft} cities={cities} cityLabels={cityLabels} /></div>
      <div className="border-t border-warm-200 bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mb-3 flex justify-between"><Button variant="ghost" onClick={() => setDraft({ ...EMPTY_FILTERS, search: filters.search })}>Reset</Button><Dialog.Close asChild><Button variant="ghost">Cancel</Button></Dialog.Close></div>
        <Button className="w-full bg-action text-action-foreground hover:bg-action-hover" onClick={() => { setFilters(draft); onClose(); }}>Show results{activeFilterCount(draft) ? ` (${activeFilterCount(draft)} ${activeFilterCount(draft) === 1 ? 'filter' : 'filters'})` : ''}</Button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>;
}

export default function FilterSidebar(props: FilterSidebarProps) {
  if (props.isMobile) return <Dialog.Root open={props.isOpen} onOpenChange={open => { if (!open) props.onClose(); }}>
    {props.isOpen && <MobileFilters {...props} />}
  </Dialog.Root>;
  return <aside className="hidden w-[260px] shrink-0 self-start rounded-xl border border-warm-200 bg-surface px-5 lg:block" aria-label="Job filters">
    <div className="flex items-center justify-between border-b border-warm-100 py-3"><h2 className="font-semibold text-warm-900">Filters</h2><Button variant="ghost" size="sm" className="text-xs text-warm-500" onClick={() => props.setFilters({ ...EMPTY_FILTERS, search: props.filters.search })}>Reset</Button></div>
    <FilterFields {...props} />
  </aside>;
}
