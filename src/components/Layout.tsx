import {useEffect, useState} from 'react';
import {Link, NavLink, Outlet, useLocation} from 'react-router-dom';
import {useCloud} from './CloudDialog';
import {useSelection} from '../lib/selection';
import {Icon} from './Icon';
import {LogoMark} from './Logo';

export function Layout() {
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const cloud = useCloud();
  const selection = useSelection();
  const count = selection.ids.length;

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenu(false);
      document.querySelector<HTMLElement>('.menu-toggle')?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menu]);

  useEffect(() => {
    setMenu(false);
    window.scrollTo({top: 0, behavior: 'instant'});
    if (location.key !== 'default') document.querySelector<HTMLElement>('#main')?.focus({preventScroll: true});
  }, [location.pathname]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="wordmark" to="/" aria-label="Odin Avatar Library home">
            <LogoMark />
            <strong>ODIN</strong>
            <span className="wordmark-rest">Avatar Library</span>
          </Link>
          <button className="menu-toggle" onClick={() => setMenu(v => !v)} aria-expanded={menu} aria-controls="site-nav">
            <span className="sr-only">{menu ? 'Close menu' : 'Open menu'}</span>
            <Icon name={menu ? 'close' : 'menu'} />
            {count && !menu ? <span className="menu-dot" aria-hidden="true" /> : null}
          </button>
          <nav id="site-nav" className={menu ? 'is-open' : ''} aria-label="Main navigation">
            <NavLink to="/packs">Explore</NavLink>
            <NavLink to="/guide">Guide</NavLink>
            <NavLink to="/downloads">Downloads</NavLink>
            <NavLink to="/help">Help</NavLink>
            <NavLink to="/selection" className="nav-selection">
              <Icon name="stack" size={18} /> My selection
              <span className={'count-pill' + (count ? ' has-items' : '')} aria-label={`${count} packs selected`}>{count}</span>
            </NavLink>
            <button className="button small" onClick={cloud}>
              <Icon name="cloud" size={18} /> Add to pCloud
            </button>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} key={location.pathname.split('/')[1]}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link className="wordmark" to="/">
              <LogoMark />
              <strong>ODIN</strong>
              <span className="wordmark-rest">Avatar Library</span>
            </Link>
            <p>An unofficial community project. Not affiliated with Odin, pCloud or the owners of the characters. All artwork and trademarks belong to their respective owners.</p>
          </div>
          <nav aria-label="Library">
            <h2>Library</h2>
            <Link to="/packs">Explore packs</Link>
            <Link to="/packs?format=animated">Animated avatars</Link>
            <Link to="/preview">Who’s Watching preview</Link>
            <Link to="/selection">My selection</Link>
            <Link to="/downloads">Downloads</Link>
          </nav>
          <nav aria-label="Support">
            <h2>Support</h2>
            <Link to="/guide">Installation guide</Link>
            <Link to="/help">Troubleshooting &amp; FAQ</Link>
            <Link to="/request">Request a pack</Link>
            <Link to="/about">About this library</Link>
            <a href="https://odinapp.dev/" target="_blank" rel="noopener noreferrer">
              Get Odin <Icon name="external" size={14} />
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
