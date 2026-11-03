import { describe, expect, it } from 'vitest';
import { EMPTY_FILTERS } from '@/components/jobs/filters';
import { selectedCities, toggleArea, toggleCity } from '@/components/jobs/geography';
const cities = ['Yavne', 'Rehovot', 'Petah Tikva', 'Rosh HaAyin', 'Unknown'];
describe('area city shortcuts', () => {
  it('adds mapped cities without discarding an existing city or other filters', () => {
    const result = toggleArea({...EMPTY_FILTERS, cities:['Yavne'], search:'QA'}, 'center', cities);
    expect(result.cities).toEqual(['Yavne','Petah Tikva','Rosh HaAyin']);
    expect(result.regions).toEqual([]); expect(result.search).toBe('QA');
  });
  it('allows removing and adding cities after selecting an area', () => {
    let result=toggleArea(EMPTY_FILTERS,'center',cities);
    result=toggleCity(result,'Petah Tikva',cities);
    result=toggleCity(result,'Yavne',cities);
    expect(result.cities).toEqual(['Rosh HaAyin','Yavne']); expect(result.regions).toEqual([]);
  });
  it('unselects only the fully selected area and preserves other cities', () => {
    let result=toggleArea({...EMPTY_FILTERS,cities:['Yavne']},'center',cities);
    result=toggleArea(result,'center',cities);expect(result.cities).toEqual(['Yavne']);
  });
  it('materializes legacy region links only on interaction and does not invent unknown mappings', () => {
    const legacy={...EMPTY_FILTERS,regions:['shfela']};expect(legacy.regions).toEqual(['shfela']);
    expect(selectedCities(legacy,cities)).toEqual(['Yavne','Rehovot']);
    expect(toggleCity(legacy,'Petah Tikva',cities).cities).toEqual(['Yavne','Rehovot','Petah Tikva']);
    expect(toggleArea(EMPTY_FILTERS,'north',cities).cities).toEqual([]);
  });
});
