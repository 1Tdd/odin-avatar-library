"""Refresh sizes and dimensions from the public pCloud share. Read-only: uses the public link, no account token."""
import json,pathlib,urllib.request,datetime
ROOT=pathlib.Path(__file__).resolve().parents[1]
CODE='kZKKkV7ZVz5DoM2iQT0H8FcDgRrkUFXp8boV'
with urllib.request.urlopen(f'https://eapi.pcloud.com/showpublink?code={CODE}',timeout=120) as r:listing=json.load(r)
assert listing.get('result')==0,listing
meta=listing['metadata'];folders={f['name']:f for f in meta['contents']}
src_path=ROOT/'audit/catalog-source.json';src=json.loads(src_path.read_text('utf8'));changed=0
for p in src:
 files={f['name']:f for f in folders[p['folder']]['contents']}
 names={x['path'].split('/',1)[1] for x in p['images']}|{p['manifest'],'avatar-names.csv'}
 extra=sorted(set(files)-names)
 if extra:print('Not in catalog:',p['folder'],extra)
 for x in p['images']:
  f=files[x['path'].split('/',1)[1]]
  new=(f['size'],f.get('width',x['width']),f.get('height',x['height']))
  if new!=(x['bytes'],x['width'],x['height']):changed+=1;x['bytes'],x['width'],x['height']=new
src_path.write_text(json.dumps(src,ensure_ascii=False,indent=1),encoding='utf8')
(ROOT/'audit/pcloud-share-current.json').write_text(json.dumps(listing,ensure_ascii=False),encoding='utf8')
def walk(f):
 if not f.get('isfolder'):return f['size'],1
 s=n=0
 for c in f.get('contents',[]):
  a,b=walk(c);s+=a;n+=b
 return s,n
total,count=walk(meta)
audit_path=ROOT/'audit/pcloud-download-audit.json';audit=json.loads(audit_path.read_text('utf8'))
# The complete ZIP stores files uncompressed, so its size is the sum of the files plus a small ZIP overhead.
archive=audit['library'].get('archive')
if archive:
 # A ready-made archive is shared separately: read its real size instead of estimating.
 with urllib.request.urlopen(f'https://eapi.pcloud.com/showpublink?code={archive}',timeout=120) as r:info=json.load(r)
 assert info.get('result')==0,info
 audit['library'].update(bytes=info['metadata']['size'],checked=datetime.date.today().isoformat())
 print('Ready-made archive:',info['metadata']['size'],'bytes, modified',info['metadata']['modified'],'- rebuild it if the library changed after that date.')
else:
 audit['library'].update(bytes=total+count*160,entries=count,crc='ESTIMATE',checked=datetime.date.today().isoformat())
audit_path.write_text(json.dumps(audit,indent=2),encoding='utf8')
print(f'{changed} images updated; share holds {count} files, {total} bytes.')
