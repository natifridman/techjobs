import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** Keep route changes predictable without moving the page while filters update. */
export default function RouteNavigation() {
  const location = useLocation();
  const navigation = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const activeKey = useRef(location.key);
  const previousPage = useRef('');
  const page =
    location.pathname +
    (location.pathname === '/company'
      ? `?name=${new URLSearchParams(location.search).get('name') || ''}`
      : '');
  useEffect(() => {
    const original = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const remember = () => positions.current.set(activeKey.current, window.scrollY);
    window.addEventListener('scroll', remember, { passive: true });
    return () => {
      window.removeEventListener('scroll', remember);
      window.history.scrollRestoration = original;
    };
  }, []);
  useLayoutEffect(() => {
    positions.current.set(activeKey.current, window.scrollY);
    activeKey.current = location.key;
    const changedPage = previousPage.current !== page;
    const firstVisit = previousPage.current === '';
    previousPage.current = page;
    if (navigation === 'POP' && !firstVisit)
      window.scrollTo({ top: positions.current.get(location.key) ?? 0, behavior: 'instant' });
    else if (changedPage && !location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
    if (changedPage && !firstVisit) document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [location.key, location.hash, navigation, page]);
  return null;
}
