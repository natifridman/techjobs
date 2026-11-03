vi.mock('../../../backend/src/jobs/companyWebsite',()=>({companyWebsite:()=>null}));
import { describe, expect, it, vi } from 'vitest';
import { jobsQueryParams } from '@/api/jobs';
import { EMPTY_FILTERS, filtersToQuery, readJobsFilters } from '@/components/jobs/filters';
import { toggleArea, toggleCity, switchToCitySelection, needsLegacyLocationConsent } from '@/components/jobs/geography';
import { filterJobs, parseJobsQuery } from '../../../backend/src/jobs/query';
import { job, payload } from '../../../backend/src/__tests__/jobs/fixtures';
const available=['Petah Tikva','Haifa','Yavne'];
const data=payload([
 job({url:'https://jobs.example.com/haifa',cities:['Haifa'],regions:['haifa-krayot']}),
 job({url:'https://jobs.example.com/center',cities:['Petah Tikva'],regions:['center']}),
 job({url:'https://jobs.example.com/legacy',cities:[],regions:['judea-samaria']}),
 job({url:'https://jobs.example.com/unrelated',cities:['Yavne'],regions:['shfela']}),
]);
const roundTrip=(f:typeof EMPTY_FILTERS)=>readJobsFilters(jobsQueryParams(filtersToQuery(f)),available).filters;
const matches=(f:typeof EMPTY_FILTERS)=>{
 const params=jobsQueryParams(filtersToQuery(f));
 const query=Object.fromEntries([...new Set(params.keys())].map(key=>[key,params.getAll(key).length>1?params.getAll(key):params.get(key)]));
 return filterJobs(data,parseJobsQuery(query).filters).map(j=>j.url.split('/').pop()).sort();
};
describe('legacy location consent with real backend filtering',()=>{
 const mixed={...EMPTY_FILTERS,regions:['center','haifa-krayot','judea-samaria']};
 it.each(['area','city'])('holds mixed legacy URL unchanged before %s edits',kind=>{
  const f=kind==='area'?toggleArea(mixed,'center',available):toggleCity(mixed,'Petah Tikva',available);
  expect(f).toEqual(mixed);expect(matches(f)).toEqual(['center','haifa','legacy']);
 });
 it('explicit switch seeds mapped cities and removes all regions',()=>{
  const f=switchToCitySelection(mixed,available);expect(f.regions).toEqual([]);expect(matches(f)).toEqual(['center','haifa']);
  expect(matches(toggleArea(f,'center',available))).toEqual(['haifa']);
  expect(matches(toggleCity(f,'Petah Tikva',available))).toEqual(['haifa']);
 });
 it('supports removing all mapped cities and adding unrelated city after consent',()=>{
  let f=switchToCitySelection(mixed,available);f=toggleCity(f,'Petah Tikva',available);f=toggleCity(f,'Haifa',available);
  expect(f.cities).toEqual([]);expect(f.regions).toEqual([]);
  expect(matches(toggleCity(f,'Yavne',available))).toEqual(['unrelated']);
 });
 it('round trips held legacy URLs without changing results',()=>expect(matches(roundTrip(mixed))).toEqual(matches(mixed)));
 it('normal city selection remains city-only',()=>{
  const f=toggleCity(EMPTY_FILTERS,'Haifa',available);expect(f.regions).toEqual([]);expect(matches(f)).toEqual(['haifa']);
 });
 it('preserves explicitcity AND region query and city selection on explicit switch',()=>{
  const f={...EMPTY_FILTERS,cities:['Haifa'],regions:['judea-samaria']};
  expect(matches(f)).toEqual([]);expect(toggleCity(f,'Yavne',available)).toEqual(f);
  expect(switchToCitySelection(f,available).cities).toEqual(['Haifa']);
 });
 it('holds unmapped-only legacy URL until explicit consent',()=>{
  const f={...EMPTY_FILTERS,regions:['judea-samaria']};expect(needsLegacyLocationConsent(f,available)).toBe(true);
  expect(toggleCity(f,'Haifa',available)).toEqual(f);expect(matches(f)).toEqual(['legacy']);
 });
 it('preserves non-location constraints during explicit switch',()=>{
  const f=switchToCitySelection({...mixed,search:'definitely absent',workModels:['remote']},available);
  expect(matches(f)).toEqual([]);expect(f.search).toBe('definitely absent');expect(f.workModels).toEqual(['remote']);
 });
});
