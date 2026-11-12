import {Link} from 'react-router-dom';
import type {Pack} from '../types';
import {useSelection} from '../lib/selection';
import {formatCount, avatarCount} from '../lib/pcloud';
import {Thumbnail} from './Media';
import {Icon} from './Icon';

export function formatLabel(p: Pack) {
  return !p.animated ? 'Static' : p.animated === p.count ? 'Animated' : 'Static & animated';
}

export function SelectButton({pack, compact = false}: {pack: Pack; compact?: boolean}) {
  const selection = useSelection();
  const selected = selection.has(pack.id);
  if (compact) {
    return (
      <button
        className={'select-chip' + (selected ? ' is-selected' : '')}
        aria-pressed={selected}
        aria-label={selected ? `Remove ${pack.title} from my selection` : `Add ${pack.title} to my selection`}
        title={selected ? 'In my selection' : 'Add to my selection'}
        onClick={() => selection.toggle(pack.id)}
      >
        <Icon name={selected ? 'check' : 'plus'} size={18} />
      </button>
    );
  }
  return (
    <button className={'button ' + (selected ? 'selected' : 'ghost')} aria-pressed={selected} onClick={() => selection.toggle(pack.id)}>
      <Icon name={selected ? 'check' : 'plus'} size={18} />
      {selected ? 'In my selection' : 'Add to selection'}
    </button>
  );
}

export function PackCard({pack, matches}: {pack: Pack; matches?: string[]}) {
  return (
    <article className="pack-card">
      <Link className="pack-cover" to={`/packs/${pack.id}`} aria-label={`${pack.title}, ${pack.platform}, ${avatarCount(pack.count)}`}>
        {pack.preview.slice(0, 3).map(a => (
          <Thumbnail key={a.id} avatar={a} size={240} alt="" />
        ))}
        {pack.animated ? (
          <span className="badge badge-animated">
            <Icon name="play" size={11} /> {pack.animated === pack.count ? 'Animated' : `${formatCount(pack.animated)} animated`}
          </span>
        ) : null}
      </Link>
      <div className="pack-card-body">
        <div>
          <h3>
            <Link to={`/packs/${pack.id}`}>{pack.title}</Link>
          </h3>
          <p className="pack-meta">
            {pack.platform} <span aria-hidden="true">·</span> {formatCount(pack.count)} {pack.count === 1 ? 'avatar' : 'avatars'}
          </p>
          {matches?.length ? (
            <p className="pack-matches">
              <Icon name="search" size={13} /> {matches.slice(0, 3).join(', ')}
              {matches.length > 3 ? ` +${matches.length - 3}` : ''}
            </p>
          ) : null}
        </div>
        <SelectButton pack={pack} compact />
      </div>
    </article>
  );
}
