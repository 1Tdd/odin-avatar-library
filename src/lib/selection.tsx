import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import type {Pack} from '../types';
import {useLibrary} from './data';

const KEY = 'odin-pack-selection';

interface Selection {
  ids: string[];
  packs: Pack[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  addMany: (ids: string[]) => void;
  removeMany: (ids: string[]) => void;
  /** True when every pack of the library is selected. */
  all: boolean;
  clear: () => void;
}

const Context = createContext<Selection | null>(null);

function read(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? [...new Set(value.filter(x => typeof x === 'string'))] : [];
  } catch {
    return [];
  }
}

/** The visitor's hand-picked packs. Stored only in this browser. */
export function SelectionProvider({children}: {children: ReactNode}) {
  const {catalog} = useLibrary();
  const [ids, setIds] = useState<string[]>(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* Private mode: the selection simply lasts for this visit. */
    }
  }, [ids]);

  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === KEY) setIds(read());
    };
    addEventListener('storage', sync);
    return () => removeEventListener('storage', sync);
  }, []);

  const toggle = useCallback((id: string) => setIds(list => (list.includes(id) ? list.filter(x => x !== id) : [...list, id])), []);
  const remove = useCallback((id: string) => setIds(list => list.filter(x => x !== id)), []);
  const addMany = useCallback((more: string[]) => setIds(list => [...list, ...more.filter(x => !list.includes(x))]), []);
  const removeMany = useCallback((gone: string[]) => setIds(list => list.filter(x => !gone.includes(x))), []);
  const clear = useCallback(() => setIds([]), []);

  const value = useMemo<Selection>(() => {
    const byId = new Map(catalog.packs.map(p => [p.id, p]));
    const packs = ids.map(id => byId.get(id)).filter((p): p is Pack => !!p);
    const set = new Set(packs.map(p => p.id));
    return {ids: packs.map(p => p.id), packs, has: id => set.has(id), toggle, remove, addMany, removeMany, clear, all: packs.length === catalog.packs.length};
  }, [catalog, ids, toggle, remove, addMany, removeMany, clear]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSelection() {
  const value = useContext(Context);
  if (!value) throw Error('Selection context is missing');
  return value;
}
