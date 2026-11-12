import {useEffect, useMemo, useState} from 'react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import type {PackDetail} from '../types';
import {useLibrary, useResource} from '../lib/data';
import {packZip, formatBytes, formatCount} from '../lib/pcloud';
import {Thumbnail, Lightbox} from '../components/Media';
import {PackCard, SelectButton, formatLabel} from '../components/PackCard';
import {Icon} from '../components/Icon';
import {ManifestButton} from '../components/DownloadButton';

const PAGE_SIZE = 60;

export default function PackPage() {
  const {id} = useParams();
  const {catalog} = useLibrary();
  if (!catalog.packs.some(p => p.id === id)) {
    return (
      <section className="page">
        <h1>Pack not found.</h1>
        <p className="page-intro">It may have been renamed or removed.</p>
        <Link className="button" to="/packs">Explore packs</Link>
      </section>
    );
  }
  return <PackContent key={id} id={id!} />;
}

function PackContent({id}: {id: string}) {
  const {catalog, config} = useLibrary();
  const summary = catalog.packs.find(p => p.id === id)!;
  const {data: p, error, retry} = useResource<PackDetail>(`/data/packs/${id}.json`);
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [onlyAnimated, setOnlyAnimated] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [params, setParams] = useSearchParams();
  const wanted = params.get('avatar');

  // A link from the character search opens straight on that avatar.
  useEffect(() => {
    if (!p || !wanted) return;
    const index = p.images.findIndex(x => x.id === wanted);
    if (index >= 0) {
      setQuery('');
      setOnlyAnimated(false);
      setLimit(n => Math.max(n, index + 1));
      setSelected(index);
    }
    setParams({}, {replace: true});
  }, [p, wanted]);

  useEffect(() => {
    document.title = `${summary.title} — Odin Avatar Library`;
  }, [summary]);

  const related = useMemo(() => {
    const score = (x: typeof summary) => (x.franchises.some(f => summary.franchises.includes(f)) ? 2 : 0) + (x.platform === summary.platform ? 1 : 0);
    return catalog.packs
      .filter(x => x.id !== summary.id && score(x) > 0)
      .sort((a, b) => score(b) - score(a) || Math.abs(a.title.localeCompare(summary.title)) - Math.abs(b.title.localeCompare(summary.title)))
      .slice(0, 3);
  }, [catalog, summary]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (p?.images ?? []).filter(x => (!q || x.name.toLowerCase().includes(q)) && (!onlyAnimated || x.animated));
  }, [p, query, onlyAnimated]);
  const shown = filtered.slice(0, limit);
  const mixed = summary.animated > 0 && summary.animated < summary.count;

  return (
    <section className="page pack-page">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/packs">Explore</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/packs?platform=${encodeURIComponent(summary.platform)}`}>{summary.platform}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{summary.title}</span>
      </nav>

      <header className="pack-hero">
        <div className="pack-hero-art" aria-hidden="true">
          {summary.preview.slice(0, 3).map(a => <Thumbnail key={a.id} avatar={a} size={240} eager alt="" />)}
        </div>
        <div className="pack-hero-copy">
          <p className="eyebrow">{summary.platform} · {summary.universe}</p>
          <h1>{summary.title}</h1>
          <ul className="fact-row">
            <li><strong>{formatCount(summary.count)}</strong> {summary.count === 1 ? 'avatar' : 'avatars'}</li>
            <li>{formatLabel(summary)}</li>
            <li>{formatBytes(summary.bytes)}</li>
          </ul>
          <div className="actions">
            {config.downloadsEnabled ? (
              <a className="button" href={packZip(config, summary)}>
                <Icon name="download" size={18} /> Download pack
              </a>
            ) : (
              <button className="button" disabled>Download unavailable</button>
            )}
            <SelectButton pack={summary} />
            <ManifestButton id={summary.manifestId} filename={summary.manifest} label="Manifest only" />
          </div>
          <p className="small muted">The pack ZIP holds this image folder and its manifest <code>{summary.manifest}</code>. Building a set? Add packs to your selection and download them together.</p>
        </div>
      </header>

      {error ? (
        <div className="empty-state">
          <h2>The avatars couldn’t load.</h2>
          <p role="alert">{error}</p>
          <button className="button" onClick={retry}>Try again</button>
        </div>
      ) : !p ? (
        <div className="avatar-grid" aria-busy="true">
          {Array.from({length: Math.min(summary.count, 18)}, (_, i) => <div className="avatar skeleton" key={i}><div className="thumbnail is-loading" /></div>)}
        </div>
      ) : (
        <>
          {p.count > 24 || mixed ? (
            <div className="pack-tools">
              {p.count > 24 ? (
                <div className="search-field compact">
                  <Icon name="search" size={18} />
                  <input type="search" aria-label="Search this pack" placeholder={`Search ${formatCount(p.count)} avatars…`} value={query} onChange={e => { setQuery(e.target.value); setLimit(PAGE_SIZE); }} />
                </div>
              ) : null}
              {mixed ? (
                <button className={'chip' + (onlyAnimated ? ' is-active' : '')} aria-pressed={onlyAnimated} onClick={() => { setOnlyAnimated(v => !v); setLimit(PAGE_SIZE); }}>
                  <Icon name="play" size={12} /> Animated only <span>{formatCount(p.animated)}</span>
                </button>
              ) : null}
              <p className="small muted" role="status">{formatCount(filtered.length)} shown</p>
            </div>
          ) : null}

          <ul className="avatar-grid">
            {shown.map((a, i) => (
              <li className="avatar" key={a.id}>
                <button className="avatar-button" onClick={() => setSelected(i)} aria-label={`Preview ${a.name}${a.animated ? ', animated' : ''}`}>
                  <Thumbnail avatar={a} size={240} alt="" />
                  {a.animated ? <span className="badge badge-animated"><Icon name="play" size={11} /><span className="sr-only">Animated</span></span> : null}
                </button>
                <p title={a.name}>{a.name}</p>
              </li>
            ))}
          </ul>

          {!filtered.length ? (
            <div className="empty-state">
              <h2>No matching avatars.</h2>
              <button className="button ghost" onClick={() => { setQuery(''); setOnlyAnimated(false); }}>Clear search</button>
            </div>
          ) : null}

          {filtered.length > limit ? (
            <div className="load-more">
              <button className="button ghost" onClick={() => setLimit(x => x + PAGE_SIZE * 2)}>
                Show more <span className="muted">({formatCount(filtered.length - limit)} left)</span>
              </button>
            </div>
          ) : null}
        </>
      )}

      <section className="install-strip">
        <div>
          <h2>Use this pack in Odin</h2>
          <p className="muted">Works with pCloud or any WebDAV storage Odin can reach.</p>
        </div>
        <ol>
          <li><span>1</span>Extract the ZIP into your <code>ODIN_PROFILE_AVATARS</code> folder.</li>
          <li><span>2</span>Upload the image folder and its <code>.json</code> side by side.</li>
          <li><span>3</span>In Odin: <strong>Settings → Profile Pictures → Browse Server for Pictures</strong>.</li>
        </ol>
        <Link className="button ghost" to="/guide?path=selected">Step-by-step guide <Icon name="arrow" size={18} /></Link>
      </section>

      {related.length ? (
        <section className="section flush">
          <header className="section-head">
            <h2>More like this</h2>
            <Link className="text-link" to={`/packs?platform=${encodeURIComponent(summary.platform)}`}>All {summary.platform} packs <Icon name="arrow" size={18} /></Link>
          </header>
          <div className="pack-grid">
            {related.map(x => <PackCard key={x.id} pack={x} />)}
          </div>
        </section>
      ) : null}

      <p className="small muted">Character names come from the source library; descriptive labels are not confirmed identities. Original filenames and manifest references are preserved.</p>

      {selected !== null && filtered[selected] ? <Lightbox avatars={filtered} index={selected} onIndex={setSelected} onClose={() => setSelected(null)} packId={summary.id} /> : null}
    </section>
  );
}
