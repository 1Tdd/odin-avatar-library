import type {Catalog} from '../types';

/**
 * A selection as a short URL value. Packs are written as their pCloud folder number relative to the
 * library folder, in base 36, so a link survives renamed packs and stays short: "5.6.a2".
 */
export function encodeSelection(catalog: Catalog, ids: string[]) {
  if (ids.length === catalog.packs.length) return 'all';
  const wanted = new Set(ids);
  return catalog.packs
    .filter(p => wanted.has(p.id))
    .map(p => (p.folderId - catalog.rootFolderId).toString(36))
    .join('.');
}

export function decodeSelection(catalog: Catalog, value: string) {
  if (value === 'all') return catalog.packs.map(p => p.id);
  const byOffset = new Map(catalog.packs.map(p => [p.folderId - catalog.rootFolderId, p.id]));
  const ids = value
    .split('.')
    .slice(0, 400)
    .map(x => (/^-?[0-9a-z]{1,8}$/.test(x) ? byOffset.get(parseInt(x, 36)) : undefined))
    .filter((x): x is string => !!x);
  return [...new Set(ids)];
}
