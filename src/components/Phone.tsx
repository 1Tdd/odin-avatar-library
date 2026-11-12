import type {ReactNode} from 'react';
import {Icon} from './Icon';

/**
 * Hand-built illustrations of Odin's screens for the guide.
 * Labels match Odin 1.0; they are drawings, not screenshots.
 */
export function Phone({title, back, children, caption}: {title: string; back?: string; children: ReactNode; caption?: string}) {
  return (
    <figure className="phone-figure">
      <div className="phone" role="img" aria-label={`Illustration of Odin’s ${title} screen`}>
        <div className="phone-notch" />
        <div className="phone-nav">
          <span className="phone-back">{back ? <><Icon name="back" size={13} /> {back}</> : null}</span>
          <strong>{title}</strong>
          <span />
        </div>
        <div className="phone-body" aria-hidden="true">{children}</div>
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export function PhoneGroup({label, note, children}: {label?: string; note?: string; children: ReactNode}) {
  return (
    <div className="phone-group">
      {label ? <p className="phone-label">{label}</p> : null}
      <div className="phone-list">{children}</div>
      {note ? <p className="phone-note">{note}</p> : null}
    </div>
  );
}

export function PhoneRow({label, value, highlight, chevron, accent, icon}: {label: ReactNode; value?: ReactNode; highlight?: boolean; chevron?: boolean; accent?: boolean; icon?: ReactNode}) {
  return (
    <div className={'phone-row' + (highlight ? ' is-highlight' : '') + (accent ? ' is-accent' : '')}>
      {icon ? <span className="phone-row-icon">{icon}</span> : null}
      <span className="phone-row-label">{label}</span>
      {value ? <span className="phone-row-value">{value}</span> : null}
      {chevron ? <span className="phone-chevron">›</span> : null}
    </div>
  );
}
