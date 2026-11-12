import {useEffect, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {encodeSelection, decodeSelection} from '../lib/share';
import {useLibrary} from '../lib/data';
import {useSelection} from '../lib/selection';
import {selectionZip, manifestsZip, manifestsZipFor, formatBytes, formatCount, avatarCount, downloadManifest, SELECTION_ZIP_LIMIT} from '../lib/pcloud';
import {Thumbnail} from '../components/Media';
import {Icon} from '../components/Icon';
import {LibraryButton} from '../components/DownloadButton';

const LIST_PREVIEW = 30;

export default function Selection() {
  const {catalog, config} = useLibrary();
  const {packs, remove, clear, addMany, all} = useSelection();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [shareNote, setShareNote] = useState('');
  const [params, setParams] = useSearchParams();

  // A shared link never replaces the visitor's own selection without asking.
  const sharedIds = params.get('s') ? decodeSelection(catalog, params.get('s')!) : [];
  const current = new Set(packs.map(p => p.id));
  const sharedNew = sharedIds.filter(id => !current.has(id));
  const dismiss = () => setParams({}, {replace: true});
  const shared = params.get('s') ? (
    <div className="notice shared-notice" role="status">
      {!sharedIds.length ? (
        <p>This shared link does not match any pack in the library.</p>
      ) : !sharedNew.length ? (
        <p>You already have all {sharedIds.length} {sharedIds.length === 1 ? 'pack' : 'packs'} from this shared selection.</p>
      ) : (
        <p>
          <strong>Someone shared {sharedIds.length} {sharedIds.length === 1 ? 'pack' : 'packs'} with you.</strong>{' '}
          {packs.length ? `${sharedNew.length} ${sharedNew.length === 1 ? 'is' : 'are'} not in your selection yet.` : `Add ${sharedIds.length === 1 ? 'it' : 'them'} to start your selection.`}
        </p>
      )}
      <div className="actions">
        {sharedNew.length ? <button className="button small" onClick={() => { addMany(sharedNew); dismiss(); }}><Icon name="plus" size={16} /> Add {sharedNew.length === 1 ? 'it' : sharedNew.length === sharedIds.length ? 'them' : `the ${sharedNew.length} new`}</button> : null}
        {sharedNew.length && packs.length ? <button className="button ghost small" onClick={() => { clear(); addMany(sharedIds); dismiss(); }}>Replace mine</button> : null}
        <button className="text-link" onClick={dismiss}>Dismiss</button>
      </div>
    </div>
  ) : null;

  async function share() {
    const url = `${location.origin}/selection?s=${encodeSelection(catalog, packs.map(p => p.id))}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareNote('Link copied. Anyone who opens it can add these packs to their own selection.');
    } catch {
      setShareNote(url);
    }
  }

  useEffect(() => {
    document.title = 'My Selection — Odin Avatar Library';
  }, []);

  const avatars = packs.reduce((n, p) => n + p.count, 0);
  const bytes = packs.reduce((n, p) => n + p.bytes + p.manifestBytes, 0);
  // pCloud builds each ZIP from the IDs in the URL, so very large selections are split into parts.
  const parts = Array.from({length: Math.ceil(packs.length / SELECTION_ZIP_LIMIT)}, (_, i) => packs.slice(i * SELECTION_ZIP_LIMIT, (i + 1) * SELECTION_ZIP_LIMIT));
  const listed = expanded ? packs : packs.slice(0, LIST_PREVIEW);
  const addEverything = () => addMany(catalog.packs.map(p => p.id));

  async function manifest() {
    setBusy(true);
    setNote('');
    try {
      await downloadManifest(config, packs[0].manifestId, packs[0].manifest);
    } catch {
      setNote('The manifest could not be downloaded. Try again, or open the library on pCloud.');
    }
    setBusy(false);
  }

  if (!packs.length) {
    return (
      <section className="page">
        <header className="page-head">
          <p className="eyebrow">My selection</p>
          <h1>Nothing here yet.</h1>
          {shared}
          <p className="page-intro">Tap the <Icon name="plus" size={18} /> on any pack to collect it here, then download everything as a single ZIP that is ready for Odin. Want it all? Add the whole library in one go.</p>
        </header>
        <div className="actions">
          <Link className="button large" to="/packs">Explore packs <Icon name="arrow" /></Link>
          <button className="button ghost large" onClick={addEverything}><Icon name="plus" /> Add all {catalog.packCount} packs</button>
        </div>
      </section>
    );
  }

  return (
    <section className="page selection-page">
      <header className="page-head">
        <p className="eyebrow">My selection</p>
        <h1>{all ? 'The whole library.' : 'Your own library.'}</h1>
        <p className="page-intro">
          {all
            ? `All ${catalog.packCount} packs in one ZIP, packed by pCloud and downloaded straight to you — image folders and manifests already laid out the way Odin expects.`
            : `${parts.length > 1 ? 'ZIPs' : 'One ZIP'} with only the packs you chose — image folders and manifests already laid out the way Odin expects.`}
        </p>
      </header>

      {shared}
      <div className="selection-layout">
        <div>
          <ul className="selection-list">
            {listed.map(p => (
              <li key={p.id}>
                <Link className="selection-art" to={`/packs/${p.id}`} tabIndex={-1} aria-hidden="true">
                  {p.preview[0] ? <Thumbnail avatar={p.preview[0]} size={128} alt="" /> : null}
                </Link>
                <div>
                  <h2><Link to={`/packs/${p.id}`}>{p.title}</Link></h2>
                  <p className="pack-meta">{p.platform} · {avatarCount(p.count)} · {formatBytes(p.bytes)}</p>
                </div>
                <button className="icon-button" onClick={() => remove(p.id)} aria-label={`Remove ${p.title}`}>
                  <Icon name="close" size={18} />
                </button>
              </li>
            ))}
          </ul>
          {packs.length > LIST_PREVIEW ? (
            <div className="load-more">
              <button className="button ghost" aria-expanded={expanded} onClick={() => setExpanded(v => !v)}>
                {expanded ? 'Show fewer' : `Show all ${packs.length} packs`}
              </button>
            </div>
          ) : null}
        </div>

        <aside className="summary-card" aria-label="Selection summary">
          <dl>
            <div><dt>Packs</dt><dd>{packs.length}</dd></div>
            <div><dt>Avatars</dt><dd>{formatCount(avatars)}</dd></div>
            <div><dt>Approx. size</dt><dd>{formatBytes(all && config.downloadAudit?.library ? config.downloadAudit.library.bytes : bytes)}</dd></div>
          </dl>
          {!config.downloadsEnabled ? (
            <button className="button block" disabled>Downloads unavailable</button>
          ) : all ? (
            <LibraryButton className="button block" label="Download complete ZIP" />
          ) : parts.length === 1 ? (
            <a className="button block" href={selectionZip(config, packs)}>
              <Icon name="download" size={18} /> Download selection ZIP
            </a>
          ) : (
            <div className="zip-parts">
              {parts.map((part, i) => (
                <a className={'button block' + (i ? ' ghost' : '')} key={i} href={selectionZip(config, part)}>
                  <Icon name="download" size={18} /> ZIP part {i + 1} of {parts.length} <span className="small">({part.length} packs)</span>
                </a>
              ))}
              <p className="small muted">Large selections come in {parts.length} parts. Extract them all into the same folder.</p>
            </div>
          )}
          {all ? (
            config.downloadsEnabled ? <a className="button ghost block" href={manifestsZip(config, catalog)}>Manifests only (ZIP)</a> : null
          ) : packs.length > 1 ? (
            config.downloadsEnabled ? <a className="button ghost block" href={manifestsZipFor(config, packs)}>Manifests only (ZIP)</a> : null
          ) : (
            <button className="button ghost block" disabled={busy || !config.downloadsEnabled} onClick={manifest}>
              {busy ? 'Downloading…' : 'Manifest only'}
            </button>
          )}
          {note ? <p className="small muted" role="status">{note}</p> : null}
          <p className="small muted">
            {all
              ? <>The ZIP contains the <code>ODIN_PROFILE_AVATARS</code> folder. Extract it and upload that folder to your storage. It is a single large file, so keep the tab open until the download finishes.</>
              : <>Extract the ZIP, then upload its contents into <code>ODIN_PROFILE_AVATARS</code> on your storage. pCloud packs the archive on request, so it downloads as one file.</>}
          </p>
          <button className="text-link" onClick={share}><Icon name="external" size={16} /> Copy a link to this selection</button>
          {shareNote ? <p className="small muted share-note" role="status">{shareNote}</p> : null}
          {!all ? <button className="text-link" onClick={addEverything}><Icon name="plus" size={16} /> Add all {catalog.packCount} packs</button> : null}
          <Link className="text-link" to={all ? '/guide?path=manual&step=3' : '/guide?path=selected&step=3'}>{all ? 'Manual-upload guide' : 'Selected-packs guide'} <Icon name="arrow" size={18} /></Link>
          <button className="text-link danger" onClick={clear}><Icon name="trash" size={16} /> Clear selection</button>
        </aside>
      </div>
      <p className="small muted">Your selection is stored only in this browser.</p>
    </section>
  );
}
