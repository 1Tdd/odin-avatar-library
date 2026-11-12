/**
 * The library mark: a one-eyed avatar — Odin gave an eye for wisdom —
 * on top of a stack of other profile pictures.
 */
export function LogoMark({size = 34}: {size?: number}) {
  return (
    <svg className="logo-mark" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <clipPath id="logo-face"><circle cx="27" cy="37" r="21" /></clipPath>
      </defs>
      <circle className="logo-stack logo-stack-far" cx="43" cy="21" r="17.5" fill="none" stroke="var(--lime)" strokeWidth="3" opacity=".35" />
      <circle className="logo-stack" cx="35" cy="29" r="19.5" fill="var(--bg)" stroke="var(--lime)" strokeWidth="3" opacity=".7" />
      <circle cx="27" cy="37" r="22.5" fill="var(--bg)" />
      <circle cx="27" cy="37" r="21" fill="var(--lime)" />
      <g clipPath="url(#logo-face)" fill="var(--lime-ink)" stroke="var(--lime-ink)" strokeLinecap="round">
        <path d="M5 25 49 40" strokeWidth="2.6" fill="none" />
        <ellipse cx="35.5" cy="34.5" rx="6.8" ry="6.2" transform="rotate(18 35.5 34.5)" stroke="none" />
        <circle className="logo-eye" cx="18.5" cy="34" r="3.3" stroke="none" />
        <path d="M17.5 45.5Q25.5 52.5 35 46.5" strokeWidth="3" fill="none" />
      </g>
    </svg>
  );
}
