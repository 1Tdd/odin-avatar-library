"""Build metadata only. Never changes cloud files or manifest references."""
import json,pathlib,csv,re,unicodedata,collections,hashlib,datetime
TODAY=datetime.date.today()
ROOT=pathlib.Path(__file__).resolve().parents[1]
source=json.loads((ROOT/'audit/catalog-source.json').read_text('utf8'))
remote=json.loads((ROOT/'audit/pcloud-share-current.json').read_text('utf8'))['metadata']
files={f['name']:f for f in remote['contents']}
rows=json.loads((ROOT/'audit/label-provenance.json').read_text('utf8'))
provenance={(r['pack'],r['nome_nuovo']):r['metodo'] for r in rows}
out=ROOT/'public/data';(out/'packs').mkdir(parents=True,exist_ok=True)
# Conservative English descriptions from existing source labels, not new identity guesses.
nouns={'guerriera':'warrior','guerriero':'warrior','ragazza':'character','ragazzo':'character','uomo':'man','donna':'woman','soldato':'soldier','gatto':'cat','gattino':'kitten','cane':'dog','cagnolino':'puppy','scheletro':'skeleton','teschio':'skull','drago':'dragon','robot':'robot','astronave':'spacecraft','maschera':'mask','elmo':'helmet','casco':'helmet','mago':'wizard','maga':'mage','cavaliere':'knight','cacciatore':'hunter','tigre':'tiger','leone':'lion','gufo':'owl','aquila':'eagle','corvo':'raven','uccello':'bird','uccellino':'bird','fenice':'phoenix','pesce':'fish','squalo':'shark','polpo':'octopus','coniglio':'rabbit','rana':'frog','rospo':'toad','volpe':'fox','lupo':'wolf','orso':'bear','panda':'panda','scimmia':'monkey','gorilla':'gorilla','maiale':'pig','mucca':'cow','pecora':'sheep','tartaruga':'turtle','serpente':'snake','coccodrillo':'crocodile','rinoceronte':'rhinoceros','elefante':'elephant','cavallo':'horse','unicorno':'unicorn','pipistrello':'bat','farfalla':'butterfly','ape':'bee','ragno':'spider','granchio':'crab','aragosta':'lobster','dinosauro':'dinosaur','pinguino':'penguin','lumaca':'snail','scoiattolo':'squirrel','criceto':'hamster','riccio':'hedgehog','cinghiale':'boar','capra':'goat','cervo':'deer','lucertola':'lizard','mostro':'monster','demone':'demon','diavolo':'devil','angelo':'angel','fantasma':'ghost','alieno':'alien','creatura':'creature','orco':'orc','troll':'troll','mummia':'mummy','zombie':'zombie','vampiro':'vampire','strega':'witch','ninja':'ninja','samurai':'samurai','pirata':'pirate','principessa':'princess','principe':'prince','regina':'queen','re':'king','giullare':'jester','pagliaccio':'clown','pupazzo':'figure','figura':'figure','volto':'face','faccina':'face','sorriso':'smile','occhio':'eye','occhi':'eyes','cervello':'brain','mano':'hand','mani':'hands','cuore':'heart','stella':'star','fiore':'flower','fungo':'mushroom','albero':'tree','pianta':'plant','frutto':'fruit','mela':'apple','banana':'banana','arancia':'orange','torta':'cake','trofeo':'trophy','calice':'goblet','megafono':'megaphone','microfono':'microphone','microfoni':'microphones','libro':'book','arco':'bow','freccia':'arrow','spada':'sword','ascia':'axe','pistola':'pistol','fucile':'rifle','carro':'tank','autocarro':'truck','macchina':'machine','auto':'car','moto':'motorcycle','aereo':'aircraft','elicottero':'helicopter','razzo':'rocket','nave':'ship','barca':'boat','sfera':'sphere','cubo':'cube','disco':'disc','palla':'ball','pallina':'ball','pallone':'ball','racchetta':'racket','nota':'musical note','scatola':'box','scudo':'shield','corona':'crown','torre':'tower','castello':'castle','montagna':'mountain','pianeta':'planet','sole':'sun','luna':'moon','nuvola':'cloud','fiamma':'flame','fiamme':'flames','fuoco':'fire','fulmine':'lightning','esplosione':'explosion','bandiera':'flag','simbolo':'symbol','emblema':'emblem','sagoma':'silhouette','nucleo':'core','tuta':'suit','paperella':'rubber duck','blob':'blob','golfista':'golfer','pugile':'boxer','calciatore':'football player','pilota':'pilot','astronauta':'astronaut','poliziotto':'police officer','detective':'detective','bambina':'child','bambino':'child','bambola':'doll','anziano':'older man','anziana':'older woman'}
colors={'rosso':'red','rossa':'red','rossi':'red','rosse':'red','blu':'blue','azzurro':'light blue','azzurra':'light blue','azzurri':'light blue','verde':'green','verdi':'green','giallo':'yellow','gialla':'yellow','viola':'purple','rosa':'pink','nero':'black','nera':'black','neri':'black','bianco':'white','bianca':'white','bianchi':'white','grigio':'gray','grigia':'gray','arancio':'orange','arancione':'orange','dorato':'gold','dorata':'gold','argento':'silver','turchese':'turquoise','turchesi':'turquoise','lilla':'lilac','marrone':'brown','biondo':'blond','bionda':'blond','biondi':'blond'}
suffixes={'sorriso':'smiling','ritratto':'portrait','profilo':'profile','animazione':'animated','variante':'variant','bastone':'staff','grido':'shouting','sorpreso':'surprised','arrabbiato':'angry','serio':'serious','posa':'pose','realistico':'realistic','umano':'human','umana':'human','alieno':'alien','maschera':'mask','bandiera':'flag','logo':'logo','simbolo':'symbol','emblema':'emblem','scena':'scene','versione':'version','con':'with','cappello':'hat','occhiali':'glasses','spada':'sword','armatura':'armor','felice':'happy','triste':'sad','danza':'dancing','corsa':'running','salto':'jumping','combattimento':'combat','neon':'neon','pixel':'pixel','pixelato':'pixel','pixelata':'pixel','cartoon':'cartoon'}
exact={'Demogorgone':'Demogorgon','Aang - Stato dell\'Avatar':'Aang — Avatar State','Gioia':'Joy','Tristezza':'Sadness','Rabbia':'Anger','Paura':'Fear','Disgusto':'Disgust','Ansia':'Anxiety','Invidia':'Envy','Imbarazzo':'Embarrassment','Noia':'Ennui'}
nouns.update({'spirito':'spirit','camioncino':'van','autobus':'bus','calligrafia':'calligraphy','viandante':'traveler','sigillo':'seal','gemma':'gemstone','croce':'cross','camion':'truck','altoparlante':'speaker','lettera':'letter','tulipano':'tulip','carne':'meat','veicolo':'vehicle','testa':'head','lama':'blade','graffettatrice':'stapler','oggetto':'object','padella':'pan','bersaglio':'target','spirale':'spiral','motociclista':'motorcyclist','mappamondo':'globe','lottatore':'fighter','motivo':'pattern','personaggio':'character','portale':'portal','fuoristrada':'off-road vehicle','bebè':'baby','scienziato':'scientist','topo':'mouse','clown':'clown','jet':'jet','scooter':'scooter','console':'console','graffiti':'graffiti'})
suffixes.update({'forma':'form','akiridiana':'Akiridion','aliena':'alien','grande':'large','piccolo':'small','piccola':'small','superiore':'upper','vista':'view','laterale':'side','frontale':'front','fronte':'front','chiaro':'light','inclinata':'angled','inclinato':'angled','orizzontale':'horizontal','primo':'close','piano':'up'})
italian_words=set(nouns)|set(colors)|set(suffixes)|set('dai dei del della dello delle dagli capelli occhi in di da con sul sulla e un una luminosi luminoso sorridente sorridenti corazzato corazzata animata animato'.split())
proper_starts=('Abby','Ellie','Nathan Drake','Chloe Frazer','Victor Sullivan','Elena Fisher','Thor','Miles Morales','Kratos','Sackboy','Ratchet','Clank','Jak','Daxter','Astro','Aloy','Crash','Spyro','Sonic','Mario','Luigi','Kirby','Yoshi','Pikachu','Lara Croft','Cloud','Sephiroth','Link','Zelda','Geralt','Jill','Leon','Ryu','Chun','Sub-Zero','Scorpion','Batman','Superman','Spider-Man','Deadpool','Hulk','Iron Man','Captain America','Venom')
def english_name(name,idx):
 if name in exact:return exact[name],False
 parts=name.split(' - ');words=re.findall(r"[\w']+",name.lower());has_italian=any(w in italian_words for w in words)
 # Official names and untranslated proper nouns are retained; prose descriptions become English.
 if any(name==v or name.startswith(v+' - ') for v in proper_starts) or (len(parts)>1 and not any(w in nouns for w in re.findall(r'\w+',parts[0].lower()))):
  base=parts[0];tail=' - '.join(parts[1:]);tailwords=re.findall(r'\w+',tail.lower())
  if any(w in italian_words for w in tailwords):
   translated=[suffixes[w] for w in tailwords if w in suffixes and w not in ['con','variante']]
   return base+(' — '+', '.join(dict.fromkeys(translated)) if translated else '')+(f' · {idx:03}' if tail else ''),False
  return name,False
 if has_italian and any(w in nouns for w in words):
  noun=next(nouns[w] for w in words if w in nouns);color=next((colors[w] for w in words if w in colors),'');mods=[]
  if 'anime' in words:mods.append('anime')
  if any(w.startswith('pixel') for w in words):mods.append('pixel-art')
  if 'capelli' in words and color:mods.insert(0,color+'-haired');color=''
  if color:mods.insert(0,color)
  text=' '.join(mods+[noun]);return text[0].upper()+text[1:]+f' · {idx:03}',True
 if any(ord(c)>0x2ff for c in name):return f'Character artwork · {idx:03}',True
 if has_italian:
  for old,new in suffixes.items():name=re.sub(r'\b'+old+r'\b',new,name,flags=re.I)
 return name,False
def slug(s):return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip('-')
pack_summaries=[];search=[];translation_review=[];all_images=[]
for p in source:
 folder=p['folder'];pid=slug(folder);rf=files[folder];rfiles={f['name']:f for f in rf['contents']};images=[]
 title=folder.split(' - ',1)[1];universe=title if p['platform']=='Disney Plus' else 'Independent collections'
 if title in ['Disney Collection','Disney TV and Junior']:universe='Disney'
 if p['platform'] in ['PlayStation','Xbox One','Xbox 360','Steam']:universe='Games'
 if p['platform']=='Crunchyroll':universe='Anime'
 franchises=[]
 if title not in ['General','Other','PS One Classics','PS2 Classics','Adults','Animated Avatars','Pop Culture Animated','Disney Collection','Disney TV and Junior','Wildlife','20th Century','Marvel','Pixar','Star Wars']:
  franchise=re.sub(r' (Season \d+|S\d+.*|II|III|IV)$','',title);franchises.append(franchise)
 for i,x in enumerate(p['images'],1):
  name,descriptive=english_name(x['name'],i);
  if not name.strip():name,descriptive=f'Avatar · {i:03}',True
  method=provenance.get((folder,x['name']),'existing source label');provisional='descrizione' in method or descriptive
  # Tag mixed Disney packs only where the label explicitly names a franchise.
  if p['platform']=='Disney Plus' and ' - ' in x['name']:
   tag=x['name'].split(' - ')[0]
   if tag not in ['Unconfirmed portrait']:franchises.append(tag)
  f=rfiles[x['path'].split('/',1)[1]];assert f['size']==x['bytes']
  item=dict(id=str(f['fileid']),name=name,path=x['path'],bytes=x['bytes'],width=x['width'],height=x['height'],animated=x['animated'],provisional=provisional)
  images.append(item);all_images.append(item)
  if name!=x['name']:translation_review.append(dict(path=x['path'],source=x['name'],english=name,descriptive=descriptive))
  search.append(dict(pack=pid,id=item['id'],name=name,original=x['name'],animated=x['animated']))
 # Refresh source-backed search labels without changing filenames.
 summary=dict(id=pid,title=title,folder=folder,folderId=rf['folderid'],platform=p['platform'],universe=universe,franchises=sorted(set(franchises)),count=len(images),animated=sum(x['animated'] for x in images),bytes=sum(x['bytes'] for x in images),manifest=p['manifest'],manifestId=files[p['manifest']]['fileid'],manifestBytes=files[p['manifest']]['size'],preview=images[:3])
 pack_summaries.append(summary)
 (out/'packs'/f'{pid}.json').write_text(json.dumps(dict(**summary,images=images),ensure_ascii=False,separators=(',',':')),encoding='utf8')
assert len(pack_summaries)==248 and len(all_images)==5108
summary=dict(version=TODAY.strftime('%Y.%m.%d'),auditedAt=TODAY.isoformat(),packCount=248,imageCount=5108,animatedCount=sum(x['animated'] for x in all_images),imageBytes=sum(x['bytes'] for x in all_images),rootFolderId=remote['folderid'],globalManifestId=files['odin-all-avatars.json']['fileid'],globalManifestBytes=files['odin-all-avatars.json']['size'],packs=pack_summaries)
(out/'catalog.json').write_text(json.dumps(summary,ensure_ascii=False,separators=(',',':')),encoding='utf8')
(out/'search.json').write_text(json.dumps(search,ensure_ascii=False,separators=(',',':')),encoding='utf8')
(ROOT/'audit/english-label-review.json').write_text(json.dumps(translation_review,ensure_ascii=False,indent=2),encoding='utf8')
config=dict(shareCode='kZKKkV7ZVz5DoM2iQT0H8FcDgRrkUFXp8boV',shareUrl='https://e.pcloud.link/publink/show?code=kZKKkV7ZVz5DoM2iQT0H8FcDgRrkUFXp8boV',apiOrigin='https://eapi.pcloud.com',downloadsEnabled=True,previewsEnabled=True,previewLimitBytes=16*1024*1024,siteUrl='',contactEmail='',contactUrl='',downloadAudit=None)
previous=ROOT/'public/site-config.json'
if previous.exists():
 for k,v in json.loads(previous.read_text('utf8')).items():
  if k in ('siteUrl','contactEmail','contactUrl','libraryArchive') and v:config[k]=v
audit=ROOT/'audit/pcloud-download-audit.json'
if audit.exists():config['downloadAudit']=json.loads(audit.read_text('utf8'))
(ROOT/'public/site-config.json').write_text(json.dumps(config,indent=2),encoding='utf8')
print('Catalog built: 248 packs / 5108 images; only metadata in public/data.')
