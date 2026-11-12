import {useDeferredValue, useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import type {SearchEntry} from '../types';
import {loadJson, useLibrary} from '../lib/data';
import {useSelection} from '../lib/selection';
import {profiles, useProfiles, MAX_PROFILES} from '../lib/profiles';
import {Thumbnail} from '../components/Media';
import {Icon} from '../components/Icon';
import {normalize} from './Catalog';

const RESULTS = 24;

/** Try avatars on Odin's "Who's Watching" screen before downloading anything. */
export default function Preview() {
  const {catalog} = useLibrary();
  const selection = useSelection();
  const list = useProfiles();
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Who’s Watching Preview — Odin Avatar Library';
  }, []);

  useEffect(() => {
    let active = true;
    setFailed(false);
    loadJson<SearchEntry[]>('/data/search.json')
      .then(x => active && setIndex(x))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [attempt]);

  const packs = useMemo(() => new Map(catalog.packs.map(p => [p.id, p])), [catalog]);
  const results = useMemo(() => {
    const q = normalize(deferred.trim());
    if (!index || q.length < 2) return [];
    const found = index.filter(x => normalize(x.name + ' ' + x.original + ' ' + (packs.get(x.pack)?.title ?? '')).includes(q));
    return found.sort((a, b) => Number(normalize(b.name).startsWith(q)) - Number(normalize(a.name).startsWith(q))).slice(0, RESULTS);
  }, [index, deferred, packs]);

  const full = list.length >= MAX_PROFILES;
  const chosen = new Set(list.map(x => x.id));
  const sources = [...new Set(list.map(x => x.pack))].map(id => packs.get(id)).filter(p => !!p);
  const missing = sources.filter(p => !selection.has(p.id));

  function surprise() {
    if (!index) return;
    const picks: SearchEntry[] = [];
    // One avatar per pack, so the screen shows a mix of worlds.
    while (picks.length < MAX_PROFILES) {
      const x = index[Math.floor(Math.random() * index.length)];
      if (!picks.some(p => p.pack === x.pack)) picks.push(x);
    }
    profiles.clear();
    picks.forEach(profiles.add);
  }

  return (
    <section className="page preview-page">
      <header className="page-head">
        <p className="eyebrow">Who’s Watching preview</p>
        <h1>Try them on first.</h1>
        <p className="page-intro">Pick up to {MAX_PROFILES} avatars and see them as profiles on Odin’s Who’s Watching screen. Nothing is downloaded and nothing changes in Odin.</p>
      </header>

      <div className="watching" aria-label="Who’s Watching preview">
        <p className="watching-title">Who’s Watching?</p>
        <ul className="watching-row">
          {list.map(x => (
            <li key={x.id}>
              <div className="watching-face">
                <Thumbnail avatar={{id: x.id, name: x.avatar}} size={240} alt={x.avatar} />
                <button className="icon-button watching-remove" onClick={() => profiles.remove(x.id)} aria-label={`Remove ${x.label || x.avatar}`}>
                  <Icon name="close" size={16} />
                </button>
              </div>
              <input aria-label={`Profile name for ${x.avatar}`} value={x.label} maxLength={14} placeholder="Name" onChange={e => profiles.rename(x.id, e.target.value)} />
            </li>
          ))}
          {Array.from({length: MAX_PROFILES - list.length}, (_, i) => (
            <li key={i} className="is-empty">
              <button className="watching-face" onClick={() => input.current?.focus()} aria-label="Add a profile: search for a character">
                <Icon name="plus" size={26} />
              </button>
              <span>Add profile</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="actions preview-actions">
        <button className="button ghost" onClick={surprise} disabled={!index}>
          <Icon name="shuffle" size={18} /> Surprise me
        </button>
        {list.length ? (
          <button className="text-link danger" onClick={profiles.clear}>
            <Icon name="trash" size={16} /> Clear
          </button>
        ) : null}
      </div>

      <div className="search-field">
        <Icon name="search" />
        <input ref={input} type="search" aria-label="Search a character to add" placeholder="Search a character or a show…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      {failed ? (
        <div role="alert" className="notice">
          Character search is unavailable. <button className="text-link" onClick={() => setAttempt(x => x + 1)}>Retry</button>
        </div>
      ) : null}
      <p className="small muted" role="status">
        {full ? `The preview holds ${MAX_PROFILES} profiles. Remove one to add another.` : deferred.trim().length < 2 ? 'Type at least two letters. You can also add avatars from any pack page.' : !index ? 'Searching…' : results.length ? `Pick an avatar to add it.` : 'No character found.'}
      </p>
      {results.length ? (
        <ul className="hit-grid">
          {results.map(x => (
            <li key={x.id}>
              <button disabled={chosen.has(x.id) || full} aria-label={`Add ${x.name} from ${packs.get(x.pack)?.title}`} onClick={() => profiles.add(x)}>
                <Thumbnail avatar={x} size={128} alt="" />
                <span className="hit-name">{x.name}</span>
                <span className="hit-pack">{chosen.has(x.id) ? 'Added' : packs.get(x.pack)?.title}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {sources.length ? (
        <div className="callout">
          <div>
            <h2>Like what you see?</h2>
            <p>
              These pictures come from{' '}
              {sources.map((p, i) => (
                <span key={p.id}>
                  {i ? (i === sources.length - 1 ? ' and ' : ', ') : ''}
                  <Link to={`/packs/${p.id}`}>{p.title}</Link>
                </span>
              ))}
              . Add {sources.length === 1 ? 'that pack' : 'those packs'} to your selection to download {sources.length === 1 ? 'it' : 'them'} for Odin.
            </p>
          </div>
          {missing.length ? (
            <button className="button" onClick={() => selection.addMany(missing.map(p => p.id))}>
              <Icon name="plus" size={18} /> Add {missing.length} {missing.length === 1 ? 'pack' : 'packs'}
            </button>
          ) : (
            <Link className="button" to="/selection">Open my selection <Icon name="arrow" size={18} /></Link>
          )}
        </div>
      ) : null}
      <p className="small muted">An illustration of Odin’s screen, not the app itself. Your preview is stored only in this browser.</p>
    </section>
  );
}
