import {useEffect} from 'react';
import {Link} from 'react-router-dom';
import {useLibrary} from '../lib/data';
import {useSelection} from '../lib/selection';
import {useCloud} from '../components/CloudDialog';
import {manifestsZip, formatBytes, formatCount} from '../lib/pcloud';
import {Icon} from '../components/Icon';
import {ManifestButton, LibraryButton} from '../components/DownloadButton';

export default function Downloads() {
  const {catalog, config} = useLibrary();
  const selection = useSelection();
  const cloud = useCloud();
  const audit = config.downloadAudit;
  const audited = new Date(catalog.auditedAt + 'T00:00:00').toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});

  useEffect(() => {
    document.title = 'Downloads & pCloud — Odin Avatar Library';
  }, []);

  return (
    <section className="page downloads-page">
      <header className="page-head">
        <p className="eyebrow">Downloads</p>
        <h1>Your library. Your storage.</h1>
        <p className="page-intro">Everything is served by pCloud. Pick the route that fits — they all end with the same folder on your storage.</p>
      </header>

      <div className="route-grid">
        <article className="route-card featured">
          <span className="route-tag">Fastest</span>
          <Icon name="cloud" size={30} />
          <h2>Save to pCloud</h2>
          <p>Copy the whole shared folder straight into your own pCloud account. No download, no upload, nothing to extract.</p>
          <ul>
            <li>Needs a pCloud account with about 3 GB free</li>
            <li>Sign-in happens on pCloud, never here</li>
          </ul>
          <button className="button block" onClick={cloud}>Add to pCloud <Icon name="external" size={16} /></button>
        </article>

        <article className="route-card">
          <Icon name="download" size={30} />
          <h2>Complete library</h2>
          <p>{formatCount(catalog.imageCount)} images and every manifest in one ZIP, for manual upload to pCloud or another WebDAV storage.</p>
          <ul>
            <li>{audit?.library ? config.libraryArchive ? `${formatBytes(audit.library.bytes)}, ready to download` : `About ${formatBytes(audit.library.bytes)}` : 'Size varies'}</li>
            <li>Allow about 6 GB locally for the ZIP and its contents</li>
          </ul>
          <LibraryButton />
        </article>

        <article className="route-card">
          <Icon name="stack" size={30} />
          <h2>Only what you want</h2>
          <p>Collect packs while you browse, then download them together — folders and manifests already in place.</p>
          <ul>
            <li>{selection.ids.length ? `${selection.ids.length} ${selection.ids.length === 1 ? 'pack' : 'packs'} selected` : 'Nothing selected yet'}</li>
            <li>Smallest download, quickest setup</li>
          </ul>
          <Link className="button ghost block" to={selection.ids.length ? '/selection' : '/packs'}>{selection.ids.length ? 'Open my selection' : 'Choose packs'} <Icon name="arrow" size={16} /></Link>
        </article>
      </div>

      <section className="section flush">
        <header className="section-head"><h2>Manifests</h2></header>
        <p className="muted measure">Manifests are small JSON files that tell Odin which pictures belong to a pack. You only need these when the images are already on your storage — for example after a metadata update.</p>
        <div className="download-list">
          <div className="download-row">
            <div>
              <h3>Separate pack manifests</h3>
              <p>{catalog.packCount} JSON files · one pack each · {audit?.manifests ? formatBytes(audit.manifests.bytes) : 'small ZIP'}</p>
            </div>
            {config.downloadsEnabled ? <a className="button ghost" href={manifestsZip(config, catalog)}>Download <Icon name="download" size={16} /></a> : <button className="button ghost" disabled>Unavailable</button>}
          </div>
          <div className="download-row">
            <div>
              <h3>All-in-one manifest</h3>
              <p><code>odin-all-avatars.json</code> · every avatar as one combined pack · {formatBytes(catalog.globalManifestBytes)}</p>
            </div>
            <ManifestButton id={catalog.globalManifestId} filename="odin-all-avatars.json" label="Download" />
          </div>
        </div>
      </section>

      <div className="callout">
        <div>
          <h2>Files saved. Now connect Odin.</h2>
          <p>Downloading or copying files does not install anything. Add your storage in Odin under <strong>Settings → Sources → Add Server</strong>, then add packs from <strong>Settings → Profile Pictures</strong>.</p>
        </div>
        <Link className="button" to="/guide?step=5">Continue the guide <Icon name="arrow" size={18} /></Link>
      </div>

      <p className="small muted measure">
        Library snapshot <strong>{catalog.version}</strong>, audited {audited}. ZIPs are assembled by pCloud on request, so a large download can take a moment to start and sizes may change if the library changes. If a download fails,{' '}
        <a href={config.shareUrl} target="_blank" rel="noopener noreferrer">open the shared folder</a> and use pCloud’s own download action.
      </p>
    </section>
  );
}
