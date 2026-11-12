import {useState} from 'react';
import {useLibrary} from '../lib/data';
import {downloadManifest, fullZip, libraryArchiveUrl} from '../lib/pcloud';
import {Icon} from './Icon';

export function ManifestButton({id, filename, label = 'Download manifest'}: {id: number; filename: string; label?: string}) {
  const {config} = useLibrary();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="download-control">
      <button
        className="button ghost"
        disabled={busy || !config.downloadsEnabled}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            await downloadManifest(config, id, filename);
          } catch {
            setError('Download unavailable. Try again, or');
          } finally {
            setBusy(false);
          }
        }}
      >
        {!config.downloadsEnabled ? 'Unavailable' : busy ? 'Preparing…' : label}
      </button>
      {error ? (
        <p role="alert" className="error-text small">
          {error} <a href={config.shareUrl} target="_blank" rel="noopener noreferrer">open the library on pCloud</a>.
        </p>
      ) : null}
    </div>
  );
}

/** Downloads the complete library: the ready-made archive when there is one, otherwise a ZIP packed on request. */
export function LibraryButton({className = 'button ghost block', label = 'Download ZIP'}: {className?: string; label?: string}) {
  const {config, catalog} = useLibrary();
  const [busy, setBusy] = useState(false);
  const packed = fullZip(config, catalog);
  if (!config.downloadsEnabled) return <button className={className} disabled>Unavailable</button>;
  if (!config.libraryArchive) {
    return <a className={className} href={packed}>{label} <Icon name="download" size={16} /></a>;
  }
  return (
    <a
      className={className}
      href={packed}
      aria-busy={busy}
      onClick={async e => {
        // Without JavaScript, or if pCloud refuses, the link still downloads the ZIP packed on request.
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        try {
          location.assign(await libraryArchiveUrl(config));
        } catch {
          location.assign(packed);
        } finally {
          setTimeout(() => setBusy(false), 4000);
        }
      }}
    >
      {busy ? 'Starting download…' : label} <Icon name="download" size={16} />
    </a>
  );
}
