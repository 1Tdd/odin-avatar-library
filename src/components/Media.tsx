import {useCallback, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import type {Avatar} from '../types';
import {useLibrary} from '../lib/data';
import {thumbUrl, loadAnimation, formatBytes} from '../lib/pcloud';
import {profiles, useProfiles, MAX_PROFILES} from '../lib/profiles';
import {Icon} from './Icon';

type Status = 'loading' | 'loaded' | 'failed';

/**
 * Square pCloud thumbnail with a shimmer placeholder. A failed preview retries once by itself and
 * again when the connection returns; `retry` adds a button where the thumbnail is not inside a link.
 */
export function Thumbnail({avatar, eager = false, size = 320, alt, retry = false}: {avatar: Pick<Avatar, 'id' | 'name'>; eager?: boolean; size?: number; alt?: string; retry?: boolean}) {
  const {config} = useLibrary();
  const img = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setAttempt(0);
    setStatus(img.current?.complete && img.current.naturalWidth ? 'loaded' : 'loading');
  }, [avatar.id, size]);

  useEffect(() => {
    if (status !== 'failed') return;
    const again = () => {
      setAttempt(n => n + 1);
      setStatus('loading');
    };
    const timer = attempt === 0 ? setTimeout(again, 4000) : undefined;
    addEventListener('online', again);
    return () => {
      clearTimeout(timer);
      removeEventListener('online', again);
    };
  }, [status, attempt]);

  const src = thumbUrl(config, avatar, size) + (attempt ? `&retry=${attempt}` : '');
  return (
    <div className={`thumbnail is-${status}`}>
      {status === 'failed' ? (
        <span className="media-error" role={retry ? undefined : 'img'} aria-label={retry ? undefined : `${alt || avatar.name}: preview unavailable`} title="The preview could not be loaded from pCloud">
          <Icon name="cloud" />
          <span className="media-error-text">No preview</span>
          {retry ? (
            <button className="button ghost small" onClick={() => { setAttempt(n => n + 1); setStatus('loading'); }}>
              Try again
            </button>
          ) : null}
        </span>
      ) : (
        <img
          ref={img}
          src={src}
          alt={alt ?? avatar.name}
          width={size}
          height={size}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('failed')}
        />
      )}
    </div>
  );
}

/** Full preview with keyboard navigation. Animations download only on request. */
export function Lightbox({avatars, index, onIndex, onClose, packId}: {avatars: Avatar[]; index: number; onIndex: (i: number) => void; onClose: () => void; packId?: string}) {
  const {config} = useLibrary();
  const preview = useProfiles();
  const avatar = avatars[index];
  const dialog = useRef<HTMLDialogElement>(null);
  const abort = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const stop = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setUrl(null);
    setBusy(false);
  }, []);

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    const hidden = () => document.hidden && stop();
    document.addEventListener('visibilitychange', hidden);
    return () => {
      trigger?.focus();
      document.removeEventListener('visibilitychange', hidden);
      abort.current?.abort();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [stop]);

  // Moving to another avatar always stops the current animation.
  useEffect(() => {
    stop();
    setError('');
  }, [avatar.id, stop]);

  const go = useCallback((step: number) => onIndex((index + step + avatars.length) % avatars.length), [index, avatars.length, onIndex]);

  async function play() {
    stop();
    setError('');
    setBusy(true);
    const control = new AbortController();
    abort.current = control;
    const timer = setTimeout(() => control.abort(), 30000);
    try {
      const next = await loadAnimation(config, avatar, control.signal);
      if (control.signal.aborted) {
        URL.revokeObjectURL(next);
        return;
      }
      urlRef.current = next;
      setUrl(next);
    } catch {
      if (abort.current === control) setError(control.signal.aborted ? 'The preview timed out. You can try again.' : 'Preview unavailable. Try again or open the library on pCloud.');
    } finally {
      clearTimeout(timer);
      if (abort.current === control) setBusy(false);
    }
  }

  const many = avatars.length > 1;

  // Arrow keys work wherever the focus is while the preview is open.
  useEffect(() => {
    if (!many) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else return;
      e.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [many, go]);

  const inPreview = preview.some(x => x.id === avatar.id);
  return (
    <dialog
      className="lightbox"
      ref={dialog}
      aria-labelledby="preview-title"
      onCancel={onClose}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <button className="icon-button close-button" onClick={onClose} aria-label="Close preview">
        <Icon name="close" />
      </button>
      <div className="lightbox-stage">
        {many ? (
          <button className="icon-button lightbox-nav" onClick={() => go(-1)} aria-label="Previous avatar">
            <Icon name="back" />
          </button>
        ) : null}
        <div className="lightbox-media">
          {url ? (
            <img className="playing-image" src={url} alt={`${avatar.name}, animated preview`} onError={() => { stop(); setError('This browser could not display the animation.'); }} />
          ) : (
            <Thumbnail key={avatar.id} avatar={avatar} size={640} eager retry />
          )}
        </div>
        {many ? (
          <button className="icon-button lightbox-nav" onClick={() => go(1)} aria-label="Next avatar">
            <Icon name="arrow" />
          </button>
        ) : null}
      </div>
      <div className="lightbox-caption">
        <h2 id="preview-title">{avatar.name}</h2>
        <p className="small muted">
          {many ? `${index + 1} of ${avatars.length} · ` : ''}
          {avatar.width}×{avatar.height} · {formatBytes(avatar.bytes)} · {avatar.animated ? 'Animated' : 'Static'}
        </p>
        {avatar.provisional ? <p className="small muted">Descriptive label — the character identity is not confirmed.</p> : null}
      </div>
      <div className="lightbox-controls">
        {avatar.animated && config.previewsEnabled ? (
          <button className="button" disabled={busy} onClick={url ? stop : play}>
            <Icon name={url ? 'stop' : 'play'} />
            {busy ? 'Loading animation…' : url ? 'Stop' : 'Play animation'}
          </button>
        ) : null}
        {packId ? (
          <button
            className={'button ' + (inPreview ? 'selected' : 'ghost')}
            aria-pressed={inPreview}
            disabled={!inPreview && preview.length >= MAX_PROFILES}
            title={!inPreview && preview.length >= MAX_PROFILES ? `The preview holds ${MAX_PROFILES} profiles` : undefined}
            onClick={() => (inPreview ? profiles.remove(avatar.id) : profiles.add({id: avatar.id, name: avatar.name, pack: packId}))}
          >
            <Icon name={inPreview ? 'check' : 'plus'} size={18} /> {inPreview ? 'In Who’s Watching' : 'Try in Who’s Watching'}
          </button>
        ) : null}
        <a className="button ghost" href={config.shareUrl} target="_blank" rel="noopener noreferrer">
          Open on pCloud <Icon name="external" size={16} />
        </a>
      </div>
      {avatar.animated && !url && !error ? <p className="small muted center">Plays only on request and downloads {formatBytes(avatar.bytes)}.</p> : null}
      {error ? <p role="alert" className="error-text center">{error}</p> : null}
      {packId && inPreview ? <p className="small center"><Link className="text-link" to="/preview">See your Who’s Watching preview <Icon name="arrow" size={16} /></Link></p> : null}
    </dialog>
  );
}
