import type {Avatar, Config, Pack, Catalog} from '../types';

export function apiUrl(c: Config, method: string, params: Record<string, string | number> = {}) {
  const url = new URL(method, c.apiOrigin + '/');
  url.search = new URLSearchParams({
    code: c.shareCode,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  })
    .toString()
    // Keep ID lists compact: pCloud reads plain commas, and long multi-pack URLs must stay short.
    .replace(/%2C/g, ',');
  return url.href;
}

/** Square thumbnail served by pCloud. Sizes must be multiples of 4. */
export function thumbUrl(c: Config, a: Pick<Avatar, 'id'>, size = 320) {
  return apiUrl(c, 'getpubthumb', {fileid: a.id, size: `${size}x${size}`, crop: 1});
}

export function zipUrl(c: Config, params: Record<string, string | number>) {
  return apiUrl(c, 'getpubzip', params);
}

export function packZip(c: Config, p: Pack) {
  return zipUrl(c, {folderids: p.folderId, fileids: p.manifestId, filename: `${p.folder}.zip`});
}

/**
 * One ZIP with several packs: every image folder plus its root-level manifest.
 * The IDs travel in the URL and pCloud drops requests much above 4 KB (150 packs pass, 190 fail),
 * so one ZIP holds at most 140 packs; larger selections are split into parts.
 */
export const SELECTION_ZIP_LIMIT = 140;
export function selectionZip(c: Config, packs: Pack[]) {
  return zipUrl(c, {
    folderids: packs.map(p => p.folderId).join(','),
    fileids: packs.map(p => p.manifestId).join(','),
    filename: 'ODIN_PROFILE_AVATARS.zip',
  });
}

/**
 * Address of the ready-made complete ZIP. `libraryArchive` is the code of a pCloud public link to that
 * file; pCloud answers with a short-lived direct download address, so the download starts at once
 * instead of waiting for pCloud to pack 2.5 GB on request.
 */
export async function libraryArchiveUrl(c: Config) {
  if (!c.libraryArchive || !/^[A-Za-z0-9]+$/.test(c.libraryArchive)) throw Error('No ready-made archive.');
  const response = await fetch(`${c.apiOrigin}/getpublinkdownload?code=${c.libraryArchive}&forcedownload=1`, {
    // pCloud refuses this call when it carries the address of another website.
    referrerPolicy: 'no-referrer',
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  const host = Array.isArray(data.hosts) ? data.hosts[0] : '';
  if (data.result !== 0 || !/^[a-z0-9.-]+\.pcloud\.com$/i.test(host) || typeof data.path !== 'string' || !data.path.startsWith('/')) throw Error('pCloud could not provide the archive.');
  return `https://${host}${data.path}`;
}

/** The complete library packed by pCloud on request. Slow to start; used when no ready-made archive is set. */
export function fullZip(c: Config, cat: Catalog) {
  return zipUrl(c, {folderids: cat.rootFolderId, filename: 'ODIN_PROFILE_AVATARS.zip'});
}

/** A small ZIP holding only the manifests of the given packs. */
export function manifestsZipFor(c: Config, packs: Pack[], filename = 'ODIN_PACK_MANIFESTS.zip') {
  return zipUrl(c, {fileids: packs.map(p => p.manifestId).join(','), filename});
}

export function manifestsZip(c: Config, cat: Catalog) {
  return manifestsZipFor(c, cat.packs, 'ODIN_SEPARATE_PACK_MANIFESTS.zip');
}

export function formatBytes(bytes: number) {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1e6) return `${(bytes / 1000).toFixed(1)} KB`;
  if (bytes < 1e9) return `${(bytes / 1e6).toFixed(bytes < 1e7 ? 2 : 1)} MB`;
  return `${(bytes / 1e9).toFixed(2)} GB`;
}

export const formatCount = (n: number) => n.toLocaleString('en-US');

/** "1 avatar", "12 avatars". */
export const avatarCount = (n: number) => `${formatCount(n)} ${n === 1 ? 'avatar' : 'avatars'}`;

export async function downloadManifest(c: Config, id: number, name: string) {
  const response = await fetch(apiUrl(c, 'getpubtextfile', {fileid: id, forcedownload: 1}), {signal: AbortSignal.timeout(25000)});
  if (!response.ok) throw Error('pCloud could not provide the manifest.');
  const text = await response.text();
  const parsed = JSON.parse(text);
  if (!parsed.title || !Array.isArray(parsed.images)) throw Error('pCloud returned an unavailable or invalid manifest.');
  const url = URL.createObjectURL(new Blob([text], {type: 'application/json'}));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Fetches one original animated file (wrapped in a ZIP by pCloud) and returns a temporary Blob URL. */
export async function loadAnimation(c: Config, a: Avatar, signal: AbortSignal) {
  if (a.bytes > c.previewLimitBytes) throw Error('This animation is too large for an inline preview. Open it on pCloud instead.');
  const r = await fetch(zipUrl(c, {fileids: a.id, filename: 'preview.zip'}), {signal});
  if (!r.ok || !r.body) throw Error('The preview is unavailable.');
  const reader = r.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > c.previewLimitBytes + 1048576) {
        await reader.cancel();
        throw Error('The preview exceeds the download limit.');
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const x of chunks) {
    bytes.set(x, offset);
    offset += x.length;
  }
  const {unzipSync} = await import('fflate');
  const filename = a.path.split('/').pop()!;
  const extracted = unzipSync(bytes, {filter: file => file.name === filename && file.originalSize === a.bytes});
  const file = extracted[filename];
  if (!file || file.length !== a.bytes) throw Error('pCloud could not provide the expected preview.');
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const type = filename.toLowerCase().endsWith('.gif') ? 'image/gif' : 'image/webp';
  return URL.createObjectURL(new Blob([file.slice().buffer as ArrayBuffer], {type}));
}
