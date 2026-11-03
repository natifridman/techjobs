import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TimedSignInGate from '@/components/TimedSignInGate';
const auth = {isLoading:false,isUnavailable:false,isAuthenticated:false,login:vi.fn()};
vi.mock('@/hooks/useAuth',()=>({useAuth:()=>auth}));
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-03T13:00:00Z'));sessionStorage.clear();auth.isLoading=false;auth.isUnavailable=false;auth.isAuthenticated=false;auth.login.mockClear();});
afterEach(()=>{cleanup();vi.useRealTimers();});
const show=(route='/jobs')=>render(<MemoryRouter initialEntries={[route]}><TimedSignInGate /></MemoryRouter>);
describe('mandatory timed guest gate',()=>{
 it.each(['/jobs/','/companies/','/company/','/saved/','/map/'])('gates trailing slash route %s',route=>{show(route);act(()=>vi.advanceTimersByTime(30_000));expect(screen.getByRole('dialog')).toBeInTheDocument();});
 it('releases existing focus traps before opening',()=>{const close=vi.fn();window.addEventListener('techjobs:mandatory-signin',close);show();act(()=>vi.advanceTimersByTime(30_000));expect(close).toHaveBeenCalledOnce();window.removeEventListener('techjobs:mandatory-signin',close);});
 it('blocks at30seconds, not before, and cannot close by Escape or outside',()=>{show();act(()=>vi.advanceTimersByTime(29_999));expect(screen.queryByRole('dialog')).toBeNull();act(()=>vi.advanceTimersByTime(1));const d=screen.getByRole('dialog');expect(screen.queryByRole('button',{name:/close/i})).toBeNull();fireEvent.keyDown(d,{key:'Escape'});fireEvent.pointerDown(document.body);expect(screen.getByRole('dialog')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Continue with Google'}));expect(auth.login).toHaveBeenCalledWith(window.location.href);});
 it('keeps elapsed time across route remount/reload',()=>{const a=show();act(()=>vi.advanceTimersByTime(20_000));a.unmount();show('/companies');act(()=>vi.advanceTimersByTime(10_000));expect(screen.getByRole('dialog')).toBeInTheDocument();});
 it.each(['/privacy','/terms','/accessibility'])('leaves %s readable',route=>{show(route);act(()=>vi.advanceTimersByTime(60_000));expect(screen.queryByRole('dialog')).toBeNull();});
 it.each(['isLoading','isUnavailable','isAuthenticated'] as const)('does not block when %s',field=>{auth[field]=true;show();act(()=>vi.advanceTimersByTime(60_000));expect(screen.queryByRole('dialog')).toBeNull();});
 it('pauses the allowance while the tab is hidden',()=>{show();act(()=>vi.advanceTimersByTime(10_000));Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});fireEvent(document,new Event('visibilitychange'));act(()=>vi.advanceTimersByTime(60_000));expect(screen.queryByRole('dialog')).toBeNull();Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});fireEvent(document,new Event('visibilitychange'));act(()=>vi.advanceTimersByTime(20_000));expect(screen.getByRole('dialog')).toBeInTheDocument();});
 it('removes the gate once signed in' ,()=>{const a=show();act(()=>vi.advanceTimersByTime(30_000));auth.isAuthenticated=true;a.rerender(<MemoryRouter><TimedSignInGate /></MemoryRouter>);expect(screen.queryByRole('dialog')).toBeNull();});
});
