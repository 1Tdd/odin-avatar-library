import {useEffect, useMemo, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {useLibrary} from '../lib/data';
import {Icon} from '../components/Icon';
import {normalize} from './Catalog';

const KINDS = [
  ['pack', 'A new pack'],
  ['name', 'A wrong or missing name'],
  ['image', 'A broken image'],
] as const;
/** The GitHub issue form that matches each kind of request, and the start of its title. */
const FORMS = {pack: ['new-pack.yml', 'New pack'], name: ['wrong-name.yml', 'Wrong name'], image: ['broken-image.yml', 'Broken image']} as const;

/** Builds a ready-to-send request. Nothing is submitted by this website. */
export default function Request() {
  const {catalog, config} = useLibrary();
  const [params] = useSearchParams();
  const [kind, setKind] = useState<(typeof KINDS)[number][0]>('pack');
  const [name, setName] = useState(params.get('name')?.slice(0, 80) ?? '');
  const [platform, setPlatform] = useState('');
  const [details, setDetails] = useState('');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    document.title = 'Request a Pack — Odin Avatar Library';
  }, []);

  const platforms = useMemo(() => [...new Set(catalog.packs.map(p => p.platform))].filter(x => x !== 'Other').sort(), [catalog]);
  const similar = useMemo(() => {
    const q = normalize(name.trim());
    return q.length < 3 ? [] : catalog.packs.filter(p => normalize(`${p.title} ${p.franchises.join(' ')}`).includes(q)).slice(0, 4);
  }, [catalog, name]);

  const label = KINDS.find(x => x[0] === kind)![1];
  const subject = `Odin Avatar Library: ${label.toLowerCase()}${name.trim() ? ` (${name.trim()})` : ''}`;
  const message = [
    `Request: ${label}`,
    `${kind === 'pack' ? 'Show, game or collection' : 'Pack or character'}: ${name.trim() || '-'}`,
    platform ? `Platform: ${platform}` : '',
    link.trim() ? `Reference: ${link.trim()}` : '',
    details.trim() ? `Details: ${details.trim()}` : '',
    `Library version: ${catalog.version}`,
  ]
    .filter(Boolean)
    .join('\n');
  const ready = name.trim().length > 1;
  const email = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(config.contactEmail ?? '') ? config.contactEmail : '';
  const contactUrl = /^https:\/\//.test(config.contactUrl ?? '') ? config.contactUrl : '';
  // A GitHub "new issue" address can be opened with the request already filled in.
  const github = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues\/new$/.test(contactUrl ?? '');
  // The issue forms in .github/ISSUE_TEMPLATE take their fields from the address.
  const issue = new URLSearchParams({template: FORMS[kind][0], title: `${FORMS[kind][1]}: ${name.trim()}`, name: name.trim()});
  if (platform) issue.set('platform', platform);
  if (link.trim()) issue.set('source', link.trim());
  if (details.trim()) issue.set('details', details.trim());
  issue.set('version', catalog.version);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied('Copied. Paste it into your message.');
    } catch {
      setCopied('Copying is blocked here. Select the text above and copy it.');
    }
  }

  return (
    <section className="page request-page">
      <header className="page-head">
        <p className="eyebrow">Request</p>
        <h1>Something missing?</h1>
        <p className="page-intro">Ask for a new pack, or report a name or an image that needs fixing. Fill in what you know, then send it.</p>
      </header>

      <div className="request-layout">
        <form className="request-form" onSubmit={e => e.preventDefault()}>
          <div className="chip-row" role="group" aria-label="What is the request about?">
            {KINDS.map(([id, text]) => (
              <button type="button" key={id} className={'chip' + (kind === id ? ' is-active' : '')} aria-pressed={kind === id} onClick={() => setKind(id)}>
                {text}
              </button>
            ))}
          </div>
          <label>
            <span>{kind === 'pack' ? 'Show, game or collection' : 'Pack or character'}</span>
            <input value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder={kind === 'pack' ? 'e.g. Severance' : 'e.g. Attack on Titan, Eren'} />
          </label>
          {kind === 'pack' && similar.length ? (
            <p className="notice">
              Already in the library:{' '}
              {similar.map((p, i) => (
                <span key={p.id}>{i ? ', ' : ''}<Link to={`/packs/${p.id}`}>{p.title}</Link> ({p.platform})</span>
              ))}
              .
            </p>
          ) : null}
          <label>
            <span>Platform <em>optional</em></span>
            <select value={platform} onChange={e => setPlatform(e.target.value)}>
              <option value="">Not sure</option>
              {platforms.map(x => <option key={x}>{x}</option>)}
              <option>Other</option>
            </select>
          </label>
          <label>
            <span>Where to find the pictures <em>optional</em></span>
            <input value={link} maxLength={200} onChange={e => setLink(e.target.value)} placeholder="A link or a short description of the source" />
          </label>
          <label>
            <span>{kind === 'pack' ? 'Anything else' : 'What is wrong'} <em>optional</em></span>
            <textarea value={details} maxLength={600} rows={4} onChange={e => setDetails(e.target.value)} placeholder={kind === 'name' ? 'Current label and the correct name' : kind === 'image' ? 'Which picture, and what you see instead' : 'Characters you would like, seasons, style…'} />
          </label>
        </form>

        <aside className="summary-card" aria-label="Your request">
          <h2>Your request</h2>
          <pre className="request-text">{message}</pre>
          {github ? (
            <a className={'button block' + (ready ? '' : ' is-disabled')} aria-disabled={!ready} href={ready ? `${contactUrl}?${issue}` : undefined} target="_blank" rel="noopener noreferrer">
              Send on GitHub <Icon name="external" size={16} />
            </a>
          ) : null}
          {email ? (
            <a className={'button block' + (github ? ' ghost' : '') + (ready ? '' : ' is-disabled')} aria-disabled={!ready} href={ready ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}` : undefined}>
              Write an email <Icon name="external" size={16} />
            </a>
          ) : null}
          {contactUrl && !github ? (
            <a className="button ghost block" href={contactUrl} target="_blank" rel="noopener noreferrer">
              Open the contact page <Icon name="external" size={16} />
            </a>
          ) : null}
          <button className={'button block' + (github || email ? ' ghost' : '')} disabled={!ready} onClick={copy}>
            <Icon name="check" size={18} /> Copy the text
          </button>
          {copied ? <p className="small muted" role="status">{copied}</p> : null}
          <p className="small muted">
            {github
              ? 'Send on GitHub opens a form with your request already filled in: check it and press Create. You need a free GitHub account, and nothing is sent until you do. Requests are public.'
              : email || contactUrl
                ? 'This website sends nothing by itself: your message goes through your own email or the contact page.'
                : 'This website sends nothing by itself. Copy the text and send it to the person who shared this library with you.'}
          </p>
        </aside>
      </div>
      <p className="small muted measure">Requests are read by volunteers, so a pack may take time or may not be possible. Artwork always belongs to its owners.</p>
    </section>
  );
}
