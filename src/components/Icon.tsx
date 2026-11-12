const paths = {
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  back: 'M20 12H4m6-6-6 6 6 6',
  external: 'M7 17 17 7M7 7h10v10',
  search: 'm20 20-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  close: 'm6 6 12 12M6 18 18 6',
  menu: 'M3 6h18M3 12h18M3 18h18',
  play: 'm8 5 11 7-11 7Z',
  stop: 'M6 6h12v12H6Z',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  chevron: 'm6 9 6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  stack: 'm12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',
  shuffle: 'M3 7h3.5c5 0 6 10 11 10H21m-3-3 3 3-3 3M3 17h3.5c1.7 0 2.9-1.1 3.9-2.6M21 7h-3.500c-1.7 0-2.900 1.100-3.900 2.600M18 4l3 3-3 3',
  cloud: 'M7 18a4.500 4.500 0 0 1-.6-8.960 6 6 0 0 1 11.500 1.500A3.800 3.800 0 0 1 17.500 18H7Z',
  trash: 'M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2.500h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z',
  spark: 'M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.500 2.500m7 7L18 18M18 6l-2.500 2.500m-7 7L6 18',
} as const;

export type IconName = keyof typeof paths;

export function Icon({name, className = '', size = 20}: {name: IconName; className?: string; size?: number}) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}
