import {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import type {Avatar, Pack} from '../types';
import {useLibrary} from '../lib/data';
import {formatCount, avatarCount} from '../lib/pcloud';
import {useCloud} from '../components/CloudDialog';
import {Thumbnail} from '../components/Media';
import {PackCard} from '../components/PackCard';
import {Icon} from '../components/Icon';

function shuffled<T>(list: T[]) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const WALL_COLUMNS = 4;
const WALL_ROWS = 6;

export default function Home() {
  const {catalog} = useLibrary();
  const cloud = useCloud();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // A different wall of real avatars on every visit: one portrait per pack, square artwork only.
  const wall = useMemo(() => {
    const pool = shuffled(catalog.packs.map(p => p.preview[Math.floor(Math.random() * p.preview.length)]).filter((a): a is Avatar => !!a && a.width === a.height));
    return Array.from({length: WALL_COLUMNS}, (_, c) => pool.slice(c * WALL_ROWS, (c + 1) * WALL_ROWS));
  }, [catalog]);

  const platforms = useMemo(() => {
    const groups = new Map<string, {name: string; packs: Pack[]; avatars: number}>();
    for (const p of catalog.packs) {
      const g = groups.get(p.platform) ?? {name: p.platform, packs: [], avatars: 0};
      g.packs.push(p);
      g.avatars += p.count;
      groups.set(p.platform, g);
    }
    return [...groups.values()].sort((a, b) => b.packs.length - a.packs.length || b.avatars - a.avatars);
  }, [catalog]);

  const [seed, setSeed] = useState(0);
  const picks = useMemo(() => shuffled(catalog.packs.filter(p => p.preview.length >= 3)).slice(0, 6), [catalog, seed]);
  const animatedPacks = useMemo(() => catalog.packs.filter(p => p.animated > 0).sort((a, b) => b.animated - a.animated), [catalog]);

  useEffect(() => {
    document.title = 'Odin Avatar Library — Find your next identity';
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Community avatar library for Odin</p>
          <h1>
            Find your next <em>identity.</em>
          </h1>
          <p className="hero-lede">
            {formatCount(catalog.imageCount)} profile pictures in {catalog.packCount} packs — heroes, villains, anime icons and animated classics. Browse them here, keep them on your own storage, use them in Odin.
          </p>
          <div className="actions">
            <Link className="button large" to="/packs">
              Explore packs <Icon name="arrow" />
            </Link>
            <Link className="button ghost large" to="/guide">
              How it works
            </Link>
          </div>
          <form className="search-field hero-search" role="search" onSubmit={e => { e.preventDefault(); navigate(search.trim() ? `/packs?q=${encodeURIComponent(search.trim())}` : '/packs'); }}>
            <Icon name="search" />
            <input type="search" aria-label="Search a character or a show" placeholder="Search a character: Eren, Batman, Pikachu…" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="button small" type="submit">Search</button>
          </form>
          <dl className="hero-stats">
            <div><dt>Packs</dt><dd>{catalog.packCount}</dd></div>
            <div><dt>Avatars</dt><dd>{formatCount(catalog.imageCount)}</dd></div>
            <div><dt>Animated</dt><dd>{formatCount(catalog.animatedCount)}</dd></div>
            <div><dt>Platforms</dt><dd>{platforms.length}</dd></div>
          </dl>
        </div>
        <div className="avatar-wall" aria-hidden="true">
          {wall.map((column, c) => (
            <div className={'wall-column' + (c % 2 ? ' reverse' : '')} key={c} style={{animationDuration: `${46 + c * 9}s`}}>
              {[...column, ...column].map((a, i) => (
                <Thumbnail key={`${a.id}-${i}`} avatar={a} size={240} eager alt="" />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <header className="section-head">
          <div>
            <p className="eyebrow">Browse</p>
            <h2>Start with a platform</h2>
          </div>
          <Link className="text-link" to="/packs">All {catalog.packCount} packs <Icon name="arrow" size={18} /></Link>
        </header>
        <div className="platform-grid">
          {platforms.map(g => (
            <Link className="platform-tile" key={g.name} to={`/packs?platform=${encodeURIComponent(g.name)}`}>
              <div className="platform-mosaic">
                {g.packs.flatMap(p => p.preview.slice(0, 1)).slice(0, g.packs.length >= 4 ? 4 : 1).map(a => (
                  <Thumbnail key={a.id} avatar={a} size={128} alt="" />
                ))}
              </div>
              <div>
                <h3>{g.name}</h3>
                <p>{g.packs.length} {g.packs.length === 1 ? 'pack' : 'packs'} · {avatarCount(g.avatars)}</p>
              </div>
              <Icon name="arrow" size={18} />
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <header className="section-head">
          <div>
            <p className="eyebrow">Discover</p>
            <h2>Six packs, picked at random</h2>
          </div>
          <button className="button ghost" onClick={() => setSeed(x => x + 1)}>
            <Icon name="shuffle" size={18} /> Shuffle
          </button>
        </header>
        <div className="pack-grid">
          {picks.map(p => <PackCard key={p.id} pack={p} />)}
        </div>
      </section>

      <section className="callout">
        <div>
          <h2>See them on Who’s Watching first.</h2>
          <p>Pick up to five avatars and preview them as profiles on Odin’s start screen, before you download a single file.</p>
        </div>
        <div className="callout-side">
          <div className="callout-faces" aria-hidden="true">
            {picks.slice(0, 4).map(p => <Thumbnail key={p.id} avatar={p.preview[0]} size={128} alt="" />)}
          </div>
          <Link className="button" to="/preview">Try the preview <Icon name="arrow" size={18} /></Link>
        </div>
      </section>

      <section className="section spotlight">
        <div>
          <p className="eyebrow">In motion</p>
          <h2>{formatCount(catalog.animatedCount)} avatars that move.</h2>
          <p>Animated packs bring a profile to life. Preview any animation right in the browser before you add it — nothing plays, or downloads, until you ask.</p>
          <Link className="button" to="/packs?format=animated">
            <Icon name="play" size={16} /> See animated packs
          </Link>
        </div>
        <ul className="spotlight-list">
          {animatedPacks.slice(0, 4).map(p => (
            <li key={p.id}>
              <Link to={`/packs/${p.id}`}>
                {p.preview[0] ? <Thumbnail avatar={p.preview[0]} size={128} alt="" /> : null}
                <span>
                  <strong>{p.title}</strong>
                  <small>{p.platform} · {formatCount(p.animated)} animated</small>
                </span>
                <Icon name="arrow" size={18} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <header className="section-head">
          <div>
            <p className="eyebrow">How it works</p>
            <h2>Three steps to a new face</h2>
          </div>
          <Link className="text-link" to="/guide">Read the full guide <Icon name="arrow" size={18} /></Link>
        </header>
        <ol className="steps">
          <li>
            <span className="step-number">1</span>
            <h3>Pick your packs</h3>
            <p>Browse the catalog and add favourites to your selection — or simply take the whole library.</p>
            <Link className="text-link" to="/packs">Explore packs</Link>
          </li>
          <li>
            <span className="step-number">2</span>
            <h3>Put them on your storage</h3>
            <p>Save the shared folder to your pCloud in one go, or download a ZIP and upload it to any WebDAV storage.</p>
            <button className="text-link" onClick={cloud}>Add to pCloud</button>
          </li>
          <li>
            <span className="step-number">3</span>
            <h3>Import in Odin</h3>
            <p>Add that storage in Odin under <em>Settings → Sources</em>, open <em>Profile Pictures</em>, and add the packs you want.</p>
            <Link className="text-link" to="/guide?step=5">Connect Odin</Link>
          </li>
        </ol>
      </section>
    </>
  );
}
