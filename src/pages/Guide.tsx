import {useEffect, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {paths, chapters, adding, pathIntroductions, webdav} from '../content/guide';
import type {Avatar} from '../types';
import {useLibrary} from '../lib/data';
import {formatCount} from '../lib/pcloud';
import {useCloud} from '../components/CloudDialog';
import {Thumbnail} from '../components/Media';
import {Phone, PhoneGroup, PhoneRow} from '../components/Phone';
import {Icon} from '../components/Icon';

function CopyField({label, value}: {label: string; value: string}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="copy-field">
      <span>{label}</span>
      <code>{value}</code>
      <button
        className="button ghost small"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            /* Clipboard blocked: the address stays selectable. */
          }
        }}
      >
        <Icon name={copied ? 'check' : 'stack'} size={15} /> {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

/** Eren from the Attack on Titan pack, used as a sample profile picture in the illustration. */
const EREN: Avatar = {id: '111968293144', name: 'Eren', path: 'Crunchyroll - Attack on Titan/Eren.png', bytes: 44194, width: 170, height: 170, animated: false, provisional: false};

const Illustration = () => <p className="small muted illustration-note">Illustrations follow Odin 1.0. Labels may differ slightly in other versions.</p>;

export default function Guide() {
  const {catalog} = useLibrary();
  const [params, setParams] = useSearchParams();
  const cloud = useCloud();
  const path = paths.some(x => x.id === params.get('path')) ? params.get('path')! : 'start';
  const last = chapters.length;
  const step = Math.min(last, Math.max(1, Math.floor(Number(params.get('step'))) || 1));
  const faces = catalog.packs.filter(p => p.preview[0] && p.preview[0].width === p.preview[0].height).slice(0, 60).filter((_, i) => i % 12 === 0).map(p => p.preview[0]);
  const sample = catalog.packs.slice(0, 3);

  useEffect(() => {
    document.title = `${chapters[step - 1]} — Installation Guide — Odin Avatar Library`;
    // On small screens the chapter list scrolls sideways: keep the current chapter in view.
    const nav = document.querySelector<HTMLElement>('.chapter-nav');
    const active = nav?.querySelector<HTMLElement>('.is-active');
    if (nav && active && nav.scrollWidth > nav.clientWidth) nav.scrollTo({left: active.offsetLeft - nav.clientWidth / 2 + active.offsetWidth / 2});
  }, [step]);

  function choose(nextPath: string, nextStep: number) {
    setParams({path: nextPath, step: String(nextStep)}, {replace: true});
    if (nextStep !== step) document.querySelector('.guide-layout')?.scrollIntoView({block: 'start'});
  }

  return (
    <section className="page guide-page">
      <header className="page-head">
        <p className="eyebrow">Installation guide</p>
        <h1>From library to profile.</h1>
        <p className="page-intro">{pathIntroductions[path].description}</p>
      </header>

      <div className="path-picker">
        <span id="path-label">I want to</span>
        <div className="chip-row" role="group" aria-labelledby="path-label">
          {paths.map(p => (
            <button key={p.id} className={'chip' + (p.id === path ? ' is-active' : '')} aria-pressed={p.id === path} onClick={() => choose(p.id, step)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="guide-layout">
        <nav className="chapter-nav" aria-label="Guide chapters">
          <ol>
            {chapters.map((c, i) => (
              <li key={c} className={step === i + 1 ? 'is-active' : step > i + 1 ? 'is-done' : ''}>
                <button aria-current={step === i + 1 ? 'step' : undefined} onClick={() => choose(path, i + 1)}>
                  <span className="chapter-dot">{step > i + 1 ? <Icon name="check" size={14} /> : i + 1}</span>
                  {c}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <article className="guide-content" key={`${path}-${step}`}>
          <p className="eyebrow">Chapter {step} of {last}</p>
          <h2>{chapters[step - 1]}</h2>

          {step === 1 ? (
            <>
              <p className="notice">{pathIntroductions[path].first}</p>
              <div className="need-grid">
                <div><Icon name="spark" size={26} /><h3>Odin</h3><p>A version with <strong>Profile Pictures</strong> in Settings. Get it from <a href="https://odinapp.dev/" target="_blank" rel="noopener noreferrer">the official Odin website</a>.</p></div>
                <div><Icon name="cloud" size={26} /><h3>WebDAV storage</h3><p>Odin reads picture packs from a WebDAV server. A pCloud account works, and so does any other WebDAV storage you own.</p></div>
                <div><Icon name="folder" size={26} /><h3>Free space</h3><p>About 3 GB for the complete library — far less if you only take a few packs.</p></div>
              </div>
              <h3>How the pieces fit</h3>
              <p>This website is a catalog: it lets you browse and download. The pictures then live on <em>your</em> storage, and Odin loads them from there. Saving files and adding packs in Odin are two separate steps — this guide covers both.</p>
              <p className="notice">Never enter your pCloud password on this website. You only type it on pCloud itself and, later, inside Odin.</p>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <p>Decide how the avatars should appear inside Odin’s picture picker.</p>
              <div className="choice-columns">
                <section className="choice recommended">
                  <span className="route-tag">Recommended</span>
                  <h3>Separate packs</h3>
                  <p>Each <code>pack - … .json</code> file becomes its own pack in Odin. Add only the ones you want — {catalog.packCount} are available.</p>
                  <p className="muted">Each manifest points to the images in its matching folder, so keep the folders where they are.</p>
                </section>
                <section className="choice">
                  <h3>One combined pack</h3>
                  <p><code>odin-all-avatars.json</code> adds all {formatCount(catalog.imageCount)} pictures as a single pack.</p>
                  <p className="muted">Quick to set up, but a very long list to scroll through.</p>
                </section>
              </div>
              <p>Avoid adding both versions unless you really want every avatar to appear twice.</p>
              <div className="actions">
                <Link className="button ghost" to="/packs">Browse the catalog <Icon name="arrow" size={18} /></Link>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h3>{adding[path].title}</h3>
              <ol className="instruction-list">
                {adding[path].steps.map(x => <li key={x}>{x}</li>)}
              </ol>
              <div className="actions">
                {path === 'selected' ? (
                  <>
                    <Link className="button" to="/packs">Choose packs <Icon name="arrow" size={18} /></Link>
                    <Link className="button ghost" to="/selection">Open my selection</Link>
                  </>
                ) : (
                  <>
                    <button className="button" onClick={cloud}><Icon name="cloud" size={18} /> Add to pCloud</button>
                    <Link className="button ghost" to="/downloads">All downloads</Link>
                  </>
                )}
              </div>
              <p className="small muted">This website cannot see your private transfers. Always check the result in your own storage.</p>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <p>Before opening Odin, make sure the folder on your storage looks like this. Every pack manifest is there twice: once in the main folder, next to the image folders, and once inside its own folder with the pictures. Odin can add a pack from either copy.</p>
              <div className="folder-diagram" role="img" aria-label="Folder diagram: ODIN_PROFILE_AVATARS contains one pack JSON file per pack and the image folders; each image folder also holds its own copy of the pack JSON">
                <div className="tree-root"><Icon name="folder" size={18} /> ODIN_PROFILE_AVATARS</div>
                <ul>
                  <li className="tree-file"><span className="file-tag">JSON</span> odin-all-avatars.json <span>optional</span></li>
                  {sample.slice(0, 2).map(p => <li key={p.id} className="tree-file"><span className="file-tag">JSON</span> {p.manifest}</li>)}
                  <li className="tree-more">… one <code>pack - … .json</code> per pack</li>
                  <li>
                    <Icon name="folder" size={16} /> {sample[0].folder}
                  </li>
                  <li className="tree-nested"><span className="file-tag">JSON</span> {sample[0].manifest} <span>same manifest</span></li>
                  <li className="tree-nested tree-more">… {sample[0].count} images</li>
                  <li><Icon name="folder" size={16} /> {sample[1].folder}<span>{sample[1].count} images + its manifest</span></li>
                  <li className="tree-more">… more image folders</li>
                </ul>
              </div>
              <ul className="check-list">
                <li><Icon name="check" size={18} /><span>The complete library has <strong>505 items</strong> in the main folder: 253 JSON files and 252 folders. A selection has fewer.</span></li>
                <li><Icon name="check" size={18} /><span>There is no <code>ODIN_PROFILE_AVATARS</code> folder inside <code>ODIN_PROFILE_AVATARS</code>.</span></li>
                <li><Icon name="check" size={18} /><span>Uploads have finished: a picture and a manifest both open on your storage.</span></li>
                <li><Icon name="check" size={18} /><span>Nothing was renamed. Filenames, spaces and capitalisation must match the manifest.</span></li>
              </ul>
            </>
          ) : null}

          {step === 5 ? (
            <div className="guide-split">
              <div>
                <p>Odin loads picture packs from a <strong>WebDAV server</strong>. pCloud offers WebDAV on every account, so you add it to Odin like any other server.</p>
                <ol className="instruction-list">
                  <li>In Odin, open <strong>Settings → Sources → Add Server</strong> and choose <strong>WebDAV</strong>.</li>
                  <li>Enter the pCloud address for your account’s region:
                    <CopyField label="Europe" value={webdav.eu} />
                    <CopyField label="United States" value={webdav.us} />
                  </li>
                  <li>Use your pCloud <strong>email</strong> as the username and your pCloud <strong>password</strong>.</li>
                  <li>Leave <strong>Scan Path</strong> empty unless you also keep videos on this storage — it only limits Odin’s media scan to one folder.</li>
                  <li>Save. Odin confirms with <strong>Connected successfully!</strong></li>
                </ol>
                <details className="hint">
                  <summary>“Authentication failed. Check username/password.”</summary>
                  <ul>
                    <li>Try the other region’s address. The region was fixed when the pCloud account was created.</li>
                    <li>Check your inbox: on a first connection pCloud emails <strong>“New login attempt. Is this you?”</strong>. Choose <strong>Yes, it’s me</strong>, then save again. Two-factor authentication can stay enabled.</li>
                    <li>If you normally sign in to pCloud with Google or Apple, set a pCloud password in your account settings first.</li>
                  </ul>
                </details>
                <p className="small muted">Using another storage? Any WebDAV server Odin can reach works the same way — upload the folder there and use that server’s address instead.</p>
              </div>
              <div>
                <Phone title="WebDAV Connection" back="Sources" caption="Adding pCloud as a WebDAV server">
                  <PhoneGroup label="Server">
                    <PhoneRow label="Name" value="pCloud" />
                    <PhoneRow label="URL" value="ewebdav.pcloud.com" highlight />
                  </PhoneGroup>
                  <PhoneGroup label="Account">
                    <PhoneRow label="Username" value="you@example.com" />
                    <PhoneRow label="Password" value="••••••••••" />
                  </PhoneGroup>
                  <PhoneGroup label="Scan Path (optional)" note="Limits the scan to a specific folder, e.g. /media or /files.">
                    <PhoneRow label="/ (entire server)" />
                  </PhoneGroup>
                  <p className="phone-status"><Icon name="check" size={14} /> Connected successfully!</p>
                </Phone>
                <Illustration />
              </div>
            </div>
          ) : null}

          {step === 6 ? (
            <>
              <p>With the server connected, add packs from <strong>Settings → Profile Pictures</strong>. Packs are shared by all profiles on the device.</p>
              <div className="phone-row-set">
                <div>
                  <Phone title="Profile Pictures" back="Settings" caption="1 · Browse your server">
                    <PhoneGroup>
                      <PhoneRow label="Server" value="pCloud ⌄" />
                      <PhoneRow label="Browse Server for Pictures" chevron highlight />
                    </PhoneGroup>
                    <p className="phone-note">A folder with a pack .json, or of images. Shared by all profiles.</p>
                    <PhoneGroup label="Picture Packs">
                      <PhoneRow label={<span className="phone-dim">No packs installed</span>} />
                    </PhoneGroup>
                  </Phone>
                </div>
                <div>
                  <Phone title="ODIN_PROFILE_AVATARS" back="Back" caption="2 · Pick a pack manifest">
                    <PhoneGroup>
                      <PhoneRow icon={<span className="file-tag">JSON</span>} label={sample[0].manifest} value="Add Pack" highlight accent />
                      <PhoneRow icon={<span className="file-tag">JSON</span>} label={sample[1].manifest} value="Add Pack" accent />
                      {sample.slice(0, 2).map(p => <PhoneRow key={p.id} icon={<Icon name="folder" size={14} />} label={p.folder} chevron />)}
                    </PhoneGroup>
                  </Phone>
                </div>
                <div>
                  <Phone title="Profile Pictures" back="Settings" caption="3 · The pack is installed">
                    <PhoneGroup>
                      <PhoneRow label="Server" value="pCloud ⌄" />
                      <PhoneRow label="Browse Server for Pictures" chevron />
                    </PhoneGroup>
                    <PhoneGroup label="Picture Packs" note="Packs are shared by all profiles. Assign a picture from the Who's Watching screen. Swipe to remove.">
                      <PhoneRow label={sample[0].title} value={`${sample[0].count}`} highlight />
                    </PhoneGroup>
                  </Phone>
                </div>
              </div>
              <Illustration />
              <ol className="instruction-list">
                <li>Open <strong>Settings → Profile Pictures</strong>. If you have several servers, choose your pCloud server in the <strong>Server</strong> menu.</li>
                <li>Tap <strong>Browse Server for Pictures</strong> and open your <code>ODIN_PROFILE_AVATARS</code> folder.</li>
                <li>The manifests are listed at the top, above the folders. Tap a <code>pack - … .json</code> file and add it. For one combined pack, choose <code>odin-all-avatars.json</code> instead.</li>
                <li>Prefer to look first? Open a pack’s folder: the same manifest is inside it, and adding it from there works just as well. Add each pack only once.</li>
                <li>The pack now appears under <strong>Picture Packs</strong>. Repeat for every pack you want.</li>
              </ol>
              <p className="notice">Add packs one manifest at a time. A single JSON that tries to describe several packs fails with “failed to parse server response”.</p>
              <details className="hint">
                <summary>Bonus: turn your own images into a pack</summary>
                <p>Odin can also build a pack for you. Open any folder of images with <strong>Browse Server for Pictures</strong>, name each picture as it should appear in the picker, choose a file name, and Odin saves the <code>.json</code> next to the images.</p>
              </details>
            </>
          ) : null}

          {step === 7 ? (
            <div className="guide-split">
              <div>
                <ol className="instruction-list">
                  <li>Go to Odin’s <strong>Who’s Watching</strong> screen.</li>
                  <li><strong>Hold a profile</strong> until a small menu appears with <strong>Rename</strong>, <strong>Change Picture</strong> and <strong>Set PIN</strong>.</li>
                  <li>Choose <strong>Change Picture</strong>.</li>
                  <li>Pick any picture from your installed packs. Every profile can use every pack.</li>
                  <li>Check that it loads — and for an animated pack, that it moves. A working preview on this website is not proof that Odin can reach your storage.</li>
                </ol>
                <h3>Keeping things tidy</h3>
                <p><strong>Remove a pack:</strong> swipe it in <em>Picture Packs</em>. This does not delete any file on your storage, and deleting files does not remove the pack from Odin.</p>
                <p><strong>Rename a picture:</strong> each manifest entry has a <code>name</code> (the label in the picker) and a <code>url</code> (the image file). Change the name freely; if you rename or move the file itself, update its <code>url</code> too, then remove the pack and add it again.</p>
                <p><strong>Moving the folder:</strong> packs remember their server and folder path. Keep the folder where it is, or add the packs again afterwards.</p>
                <div className="actions">
                  <Link className="button" to="/packs">Find more packs <Icon name="arrow" size={18} /></Link>
                  <Link className="button ghost" to="/preview">Preview Who’s Watching</Link>
                  <Link className="button ghost" to="/help">Something not working?</Link>
                </div>
              </div>
              <div>
                <Phone title="Who’s Watching" caption="Hold a profile, then Change Picture">
                  <div className="phone-profiles">
                    <div>
                      <Thumbnail avatar={EREN} size={128} alt="" />
                      <span>Alex</span>
                    </div>
                    <div className="is-highlight">
                      <div className="thumbnail is-loaded"><img src="/guide/jeor.png" alt="" width={128} height={128} loading="lazy" decoding="async" /></div>
                      <span>Jeor</span>
                    </div>
                    {faces.slice(2, 4).map((a, i) => (
                      <div key={a.id}>
                        <Thumbnail avatar={a} size={128} alt="" />
                        <span>{['Robin', 'Kids'][i]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="phone-menu">
                    <span>Rename</span>
                    <span className="is-highlight">Change Picture</span>
                    <span>Set PIN</span>
                  </div>
                  <p className="phone-note center">Hold a profile for options. Drag to reorder.</p>
                </Phone>
                <Illustration />
              </div>
            </div>
          ) : null}

          <div className="guide-next">
            {step > 1 ? <button className="button ghost" onClick={() => choose(path, step - 1)}><Icon name="back" size={18} /> {chapters[step - 2]}</button> : <span />}
            {step < last ? <button className="button" onClick={() => choose(path, step + 1)}>Next: {chapters[step]} <Icon name="arrow" size={18} /></button> : null}
          </div>
        </article>
      </div>
    </section>
  );
}
