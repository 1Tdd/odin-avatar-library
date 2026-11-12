// Runs after `vite build`. Writes one HTML file per page so that every address answers with its own
// title, description and link preview, plus 404.html, sitemap.xml and robots.txt.
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

const dist = resolve('dist');
const read = file => readFileSync(resolve(dist, file), 'utf8');
const write = (file, text) => {
  mkdirSync(dirname(resolve(dist, file)), {recursive: true});
  writeFileSync(resolve(dist, file), text);
};

const config = JSON.parse(read('site-config.json'));
const catalog = JSON.parse(read('data/catalog.json'));
const candidate = (process.env.SITE_URL || config.siteUrl || '').trim().replace(/\/+$/, '');
if (!/^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(candidate)) throw new Error('Set siteUrl in public/site-config.json (or SITE_URL) to the public address, e.g. https://example.com');
const base = candidate;

const PAGES = {
  '/': null,
  '/packs': ['Explore Packs', 'Browse every avatar pack by platform, search a character and filter by format or size.'],
  '/guide': ['Installation Guide', 'Step by step: save the avatar library to your storage, connect it to Odin and add the packs.'],
  '/downloads': ['Downloads & pCloud', 'Save the library to pCloud, download it as a ZIP, or take only the packs you want.'],
  '/help': ['Troubleshooting & FAQ', 'Fix missing images, failed imports and connection problems between Odin and pCloud.'],
  '/about': ['About the Library', 'An unofficial community collection of profile pictures for Odin.'],
  '/preview': ['Who’s Watching Preview', 'Try avatars on Odin’s Who’s Watching screen before downloading anything.'],
  '/request': ['Request a Pack', 'Ask for a new avatar pack or report a name or an image that needs fixing.'],
  '/selection': ['My Selection', 'Your own set of avatar packs, ready to download as one ZIP for Odin.'],
};
const UNLISTED = ['/selection'];

const escape = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);
const template = read('index.html');
const image = escape(base + '/og-image.png');
const shared = `<meta property="og:site_name" content="Odin Avatar Library"/><meta property="og:image" content="${image}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="Odin Avatar Library"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:image" content="${image}"/>`;

function page(path, meta) {
  let out = template;
  if (meta) {
    const title = escape(`${meta[0]} — Odin Avatar Library`);
    const text = escape(meta[1]);
    out = out
      .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*/, `$1${title}`)
      .replace(/(<meta name="description" content=")[^"]*/, `$1${text}`)
      .replace(/(<meta property="og:description" content=")[^"]*/, `$1${text}`);
  }
  const url = escape(base + path);
  const robots = UNLISTED.includes(path) ? '<meta name="robots" content="noindex"/>' : '';
  return out.replace('</head>', `<link rel="canonical" href="${url}"/><meta property="og:url" content="${url}"/>${robots}${shared}</head>`);
}

const listed = [];
for (const [path, meta] of Object.entries(PAGES)) {
  write(path === '/' ? 'index.html' : `${path.slice(1)}.html`, page(path, meta));
  if (!UNLISTED.includes(path)) listed.push(path);
}
for (const p of catalog.packs) {
  const path = `/packs/${p.id}`;
  write(`packs/${p.id}.html`, page(path, [p.title, `${p.count} ${p.count === 1 ? 'avatar' : 'avatars'} from ${p.title} (${p.platform}) for your Odin profiles. Preview the pack and download it from pCloud.`]));
  listed.push(path);
}

write('404.html', template.replace(/<title>[^<]*<\/title>/, '<title>Page not found — Odin Avatar Library</title>').replace('</head>', `<meta name="robots" content="noindex"/>${shared}</head>`));
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${listed.map(p => `<url><loc>${escape(base + p)}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
console.log(`Prerendered ${listed.length + UNLISTED.length} pages for ${base}`);
