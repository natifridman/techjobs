import {afterEach,describe,it,expect,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import Layout from '@/components/Layout';
vi.mock('@/components/LayoutHeader',()=>({default:()=> <header>Header</header>}));
vi.mock('@/components/AddCompanyModal',()=>({default:()=>null}));
vi.mock('@/components/GoogleAd',()=>({BannerAd:()=>null}));
afterEach(cleanup);
describe('Patreon support link',()=>{
 it('offers an optional external link without replacing footer navigation',()=>{
  render(<MemoryRouter><Layout><h1>Jobs content</h1></Layout></MemoryRouter>);
  const strip=screen.getByRole('complementary',{name:'Support TechJobsIL'});
  const primary=within(strip).getByRole('link',{name:'Support on Patreon (opens in a new tab)'});
  expect(primary).toHaveAttribute('href','https://patreon.com/techjobsil?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink');
  expect(primary).toHaveAttribute('target','_blank');expect(primary).toHaveAttribute('rel','noopener noreferrer');
  expect(strip.compareDocumentPosition(screen.getByRole('main')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const footer=screen.getByRole('contentinfo');const a=within(footer).getByRole('link',{name:'Support TechJobsIL on Patreon (opens in a new tab)'});
  expect(a).toHaveAttribute('href','https://patreon.com/techjobsil?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink');
  expect(a).toHaveAttribute('target','_blank');expect(a).toHaveAttribute('rel','noopener noreferrer');
  for(const name of ['Privacy','Terms','Accessibility'])expect(within(footer).getByRole('link',{name})).toBeInTheDocument();
  expect(within(footer).getByRole('button',{name:'Suggest a company'})).toBeInTheDocument();
  expect(screen.getByRole('heading',{name:'Jobs content'})).toBeInTheDocument();
 });
});
