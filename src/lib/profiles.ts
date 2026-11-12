import {useSyncExternalStore} from 'react';

/** One profile of the visitor's "Who's Watching" preview. Stored only in this browser. */
export interface PreviewProfile {
  id: string;
  label: string;
  avatar: string;
  pack: string;
}

export const MAX_PROFILES = 5;
const KEY = 'odin-preview-profiles';
const listeners = new Set<() => void>();
let cached: PreviewProfile[] | null = null;

function read(): PreviewProfile[] {
  if (cached) return cached;
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    cached = Array.isArray(value)
      ? value.filter(x => x && typeof x.id === 'string' && /^\d+$/.test(x.id) && typeof x.label === 'string' && typeof x.avatar === 'string' && typeof x.pack === 'string').slice(0, MAX_PROFILES)
      : [];
  } catch {
    cached = [];
  }
  return cached!;
}

function write(next: PreviewProfile[]) {
  cached = next.slice(0, MAX_PROFILES);
  try {
    localStorage.setItem(KEY, JSON.stringify(cached));
  } catch {
    /* Private mode: the preview simply lasts for this visit. */
  }
  listeners.forEach(f => f());
}

function subscribe(f: () => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}

export const profiles = {
  add(p: {id: string; name: string; pack: string}) {
    const list = read();
    if (list.length >= MAX_PROFILES || list.some(x => x.id === p.id)) return false;
    write([...list, {id: p.id, avatar: p.name, pack: p.pack, label: p.name.split(/ [-—·] /)[0].slice(0, 14)}]);
    return true;
  },
  remove: (id: string) => write(read().filter(x => x.id !== id)),
  rename: (id: string, label: string) => write(read().map(x => (x.id === id ? {...x, label: label.slice(0, 14)} : x))),
  set: (list: PreviewProfile[]) => write(list),
  clear: () => write([]),
};

export function useProfiles() {
  return useSyncExternalStore(subscribe, read, read);
}
