import {useDeferredValue, useEffect, useMemo, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {loadJson, useLibrary} from '../lib/data';
import {useSelection} from '../lib/selection';
import type {SearchEntry} from '../types';
import {formatCount, avatarCount} from '../lib/pcloud';
import {PackCard} from '../components/PackCard';
import {Thumbnail} from '../components/Media';
import {Icon} from '../components/Icon';

export const normalize = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

const PAGE_SIZE = 24;
const FORMATS = [
  ['', 'Any format'],
  ['static', 'Static only'],
  ['animated', 'Includes animation'],
  ['full', 'Fully animated'],
] as const;
const SIZES = [
  ['', 'Any pack size'],
  ['small', 'Up to 10 avatars'],
  ['medium', '11 to 50 avatars'],
  ['large', 'More than 50'],
] as const;
const SORTS = [
  ['az', 'A–Z'],
  ['za', 'Z–A'],
  ['count', 'Most avatars'],
  ['few', 'Fewest avatars'],
  ['large', 'Largest download'],
  ['small', 'Smallest download'],
] as const;
const HITS_PREVIEW = 12;
const HITS_MAX = 60;

export default function Catalog() {
  const {catalog} = useLibrary();
  const selection = useSelection();
  const [params, setParams] = useSearchParams();
  const [searchIndex, setSearchIndex] = useState<SearchEntry[] | null>(null);
  const [searchError, setSearchError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const query = params.get('q') || '';
  const deferred = useDeferredValue(query);
  const platforms = params.getAll('platform');
  const universe = params.get('universe') || '';
  const format = params.get('format') || '';
  const sort = params.get('sort') || 'az';
  const size = params.get('size') || '';
  const [allHits, setAllHits] = useState(false);

  useEffect(() => {
    document.title = 'Explore Packs — Odin Avatar Library';
  }, []);

  // "/" jumps to the search field, like most catalogs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!query || searchIndex) return;
    let active = true;
    setSearchError(false);
    loadJson<SearchEntry[]>('/data/search.json')
      .then(x => active && setSearchIndex(x))
      .catch(() => active && setSearchError(true));
    return () => {
      active = false;
    };
  }, [query, searchIndex, attempt]);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next, {replace: true});
  }

  function togglePlatform(platform: string) {
    const next = new URLSearchParams(params);
    const values = platforms.includes(platform) ? platforms.filter(x => x !== platform) : [...platforms, platform];
    next.delete('platform');
    values.forEach(x => next.append('platform', x));
    next.delete('page');
    setParams(next, {replace: true});
  }

  const platformCounts = useMemo(
    () => Object.entries(catalog.packs.reduce<Record<string, number>>((o, p) => ((o[p.platform] = (o[p.platform] || 0) + 1), o), {})).sort((a, b) => b[1] - a[1]),
    [catalog],
  );
  const universes = useMemo(() => Array.from(new Set(catalog.packs.map(p => p.universe))).sort(), [catalog]);

  const {result, matches, hits} = useMemo(() => {
    const q = normalize(deferred.trim());
    const matches = new Map<string, string[]>();
    const found: SearchEntry[] = [];
    if (q && searchIndex) {
      for (const x of searchIndex) {
        if (normalize(x.name + ' ' + x.original).includes(q)) {
          const list = matches.get(x.pack) ?? [];
          if (!list.includes(x.name)) list.push(x.name);
          matches.set(x.pack, list);
          found.push(x);
        }
      }
    }
    const filtered = catalog.packs.filter(
      p =>
        (!platforms.length || platforms.includes(p.platform)) &&
        (!universe || p.universe === universe) &&
        (!format || (format === 'full' ? p.animated === p.count : format === 'static' ? p.animated === 0 : p.animated > 0)) &&
        (!size || (size === 'small' ? p.count <= 10 : size === 'large' ? p.count > 50 : p.count > 10 && p.count <= 50)) &&
        (!q || normalize(`${p.title} ${p.platform} ${p.universe} ${p.franchises.join(' ')}`).includes(q) || matches.has(p.id)),
    );
    const order: Record<string, (a: typeof filtered[number], b: typeof filtered[number]) => number> = {
      za: (a, b) => b.title.localeCompare(a.title),
      count: (a, b) => b.count - a.count,
      few: (a, b) => a.count - b.count,
      large: (a, b) => b.bytes - a.bytes,
      small: (a, b) => a.bytes - b.bytes,
    };
    filtered.sort((a, b) => (order[sort]?.(a, b) || a.title.localeCompare(b.title)) || a.platform.localeCompare(b.platform));
    // Character matches follow the other filters, and names starting with the query come first.
    const shown = new Set(filtered.map(p => p.id));
    const hits = found
      .filter(x => shown.has(x.pack))
      .sort((a, b) => Number(normalize(b.name).startsWith(q)) - Number(normalize(a.name).startsWith(q)));
    return {result: filtered, matches, hits};
  }, [catalog, deferred, searchIndex, platforms.join('|'), universe, format, sort, size]);
  const packTitle = useMemo(() => new Map(catalog.packs.map(p => [p.id, p.title])), [catalog]);

  useEffect(() => setAllHits(false), [deferred]);

  const pages = Math.max(1, Math.ceil(result.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(params.get('page'))) || 1));
  const visible = result.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const searching = !!query && !searchIndex && !searchError;
  const filtered = !!(query || platforms.length || universe || format || size);
  const avatars = result.reduce((n, p) => n + p.count, 0);
  const resultIds = result.map(p => p.id);
  const allAdded = resultIds.length > 0 && resultIds.every(id => selection.has(id));

  function goTo(n: number) {
    const next = new URLSearchParams(params);
    if (n > 1) next.set('page', String(n));
    else next.delete('page');
    setParams(next);
    document.querySelector('.catalog-tools')?.scrollIntoView({block: 'start'});
  }

  return (
    <section className="page catalog-page">
      <header className="page-head">
        <p className="eyebrow">Explore</p>
        <h1>Find your universe.</h1>
        <p className="page-intro">{catalog.packCount} packs and {formatCount(catalog.imageCount)} avatars. Search a character, a show or a platform.</p>
      </header>

      <div className="catalog-tools">
        <div className="search-field">
          <Icon name="search" />
          <input ref={input} aria-label="Search characters, packs, franchises or platforms" type="search" placeholder="Search characters, packs, franchises…" value={query} onChange={e => update('q', e.target.value)} />
          <kbd aria-hidden="true">/</kbd>
        </div>
        <div className="chip-row" role="group" aria-label="Filter by platform">
          <button className={'chip' + (!platforms.length ? ' is-active' : '')} aria-pressed={!platforms.length} onClick={() => { const next = new URLSearchParams(params); next.delete('platform'); next.delete('page'); setParams(next, {replace: true}); }}>
            All
          </button>
          {platformCounts.map(([p, n]) => (
            <button key={p} className={'chip' + (platforms.includes(p) ? ' is-active' : '')} aria-pressed={platforms.includes(p)} onClick={() => togglePlatform(p)}>
              {p} <span>{n}</span>
            </button>
          ))}
        </div>
        <div className="results-toolbar">
          <p role="status" aria-live="polite">
            {searching ? 'Searching all characters…' : (<><strong>{result.length}</strong> {result.length === 1 ? 'pack' : 'packs'} · {avatarCount(avatars)}</>)}
          </p>
          <div className="toolbar-selects">
            <select aria-label="Universe" value={universe} onChange={e => update('universe', e.target.value)}>
              <option value="">All universes</option>
              {universes.map(x => <option key={x}>{x}</option>)}
            </select>
            <select aria-label="Format" value={format === 'mixed' ? 'animated' : format} onChange={e => update('format', e.target.value)}>
              {FORMATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select aria-label="Pack size" value={size} onChange={e => update('size', e.target.value)}>
              {SIZES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select aria-label="Sort packs" value={sort} onChange={e => update('sort', e.target.value === 'az' ? '' : e.target.value)}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {filtered ? <button className="text-link" onClick={() => setParams({}, {replace: true})}>Reset</button> : null}
            {result.length && !searching ? (
              <button className={'button small ' + (allAdded ? 'selected' : 'ghost add-all')} aria-pressed={allAdded} onClick={() => (allAdded ? selection.removeMany(resultIds) : selection.addMany(resultIds))}>
                <Icon name={allAdded ? 'check' : 'plus'} size={16} />
                {allAdded ? (filtered ? 'All added' : 'Whole library added') : filtered ? `Add all ${result.length}` : `Add all ${result.length} packs`}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {searchError ? (
        <div role="alert" className="notice">
          Character search is unavailable. Pack names and filters still work. <button className="text-link" onClick={() => setAttempt(x => x + 1)}>Retry</button>
        </div>
      ) : null}

      {hits.length ? (
        <section className="character-hits" aria-label="Matching characters">
          <header>
            <h2>Characters <span>{formatCount(hits.length)}</span></h2>
            {hits.length > HITS_PREVIEW ? (
              <button className="text-link" aria-expanded={allHits} onClick={() => setAllHits(v => !v)}>
                {allHits ? 'Show fewer' : `Show ${hits.length > HITS_MAX ? `first ${HITS_MAX}` : `all ${hits.length}`}`}
              </button>
            ) : null}
          </header>
          <ul className="hit-grid">
            {hits.slice(0, allHits ? HITS_MAX : HITS_PREVIEW).map(x => (
              <li key={x.id}>
                <Link to={`/packs/${x.pack}?avatar=${x.id}`}>
                  <Thumbnail avatar={x} size={128} alt="" />
                  <span className="hit-name">{x.name}</span>
                  <span className="hit-pack">{packTitle.get(x.pack)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {allHits && hits.length > HITS_MAX ? <p className="small muted">Showing the first {HITS_MAX}. Add a word to narrow the search.</p> : null}
        </section>
      ) : null}

      {hits.length && result.length ? <h2 className="results-heading">Packs</h2> : null}

      {!result.length && !searching ? (
        <div className="empty-state">
          <h2>No matching packs.</h2>
          <p>Try another name or clear your filters. Missing a show or a character? Tell us.</p>
          <div className="actions">
            <button className="button ghost" onClick={() => setParams({}, {replace: true})}>Clear filters</button>
            <Link className="button ghost" to={query ? `/request?name=${encodeURIComponent(query)}` : '/request'}>Request a pack</Link>
          </div>
        </div>
      ) : (
        <div className="pack-grid">
          {visible.map(p => <PackCard key={p.id} pack={p} matches={matches.get(p.id)} />)}
        </div>
      )}

      {pages > 1 ? (
        <nav className="pagination" aria-label="Catalog pages">
          <button className="button ghost" disabled={page === 1} onClick={() => goTo(page - 1)}><Icon name="back" size={18} /> Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="button ghost" disabled={page === pages} onClick={() => goTo(page + 1)}>Next <Icon name="arrow" size={18} /></button>
        </nav>
      ) : null}
    </section>
  );
}
