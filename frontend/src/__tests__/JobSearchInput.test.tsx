import {act,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe,it,expect,vi,beforeEach} from 'vitest';
import JobSearchInput from '@/components/jobs/JobSearchInput';
import {fetchJobSuggestions} from '@/api/jobs';
import {useState} from 'react';
vi.mock('@/api/jobs',()=>({fetchJobSuggestions:vi.fn()}));
function Demo(){const [value,setValue]=useState('');return <JobSearchInput id="demo" label="Search roles" value={value} onChange={setValue} placeholder="Search"/>;}
beforeEach(()=>{vi.mocked(fetchJobSuggestions).mockReset().mockResolvedValue([{text:'Product Manager',count:4},{text:'Product Designer',count:2}]);});
describe('job title suggestions',()=>{
 it('offers real API suggestions, fills with keyboard and dismisses with Escape',async()=>{
  const u=userEvent.setup();render(<Demo/>);const input=screen.getByRole('searchbox');
  await u.type(input,'product');await screen.findByRole('listbox');
  expect(screen.getAllByRole('option')).toHaveLength(2);
  await u.keyboard('{ArrowDown}{Enter}');expect(input).toHaveValue('Product Manager');expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  await u.type(input,'x');await screen.findByRole('listbox');await u.keyboard('{Escape}');expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
 });
 it('keeps free text usable when suggestions fail',async()=>{
  let reject!: (reason:Error)=>void;vi.mocked(fetchJobSuggestions).mockImplementation(()=>new Promise((_,r)=>{reject=r;}));const u=userEvent.setup();render(<Demo/>);const input=screen.getByRole('searchbox');await u.type(input,'מוצר');await waitFor(()=>expect(typeof reject).toBe('function'));await act(async()=>reject(new Error('unavailable')));expect(input).toHaveValue('מוצר');expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
 });
 it('fills a clicked suggestion without submitting and keeps arbitrary searches working',async()=>{
  const u=userEvent.setup();render(<Demo/>);const input=screen.getByRole('searchbox');await u.type(input,'product');
  await u.click(await screen.findByRole('option',{name:/Product Designer/}));expect(input).toHaveValue('Product Designer');
  await u.clear(input);await u.type(input,'z');await waitFor(()=>expect(screen.queryByRole('listbox')).not.toBeInTheDocument());expect(input).toHaveValue('z');
 });
});
