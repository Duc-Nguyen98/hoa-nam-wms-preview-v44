from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance, ImageDraw
import json, hashlib, sys
root=Path.cwd(); task=root/'docs/quality/uiux-task-HN-S12-UIUX-006'; phase=sys.argv[1]; source=task/'visual'/phase; out=task/'visual'/(phase+'-isotropic')
out.mkdir(exist_ok=True)
if (out/'registration.json').exists(): raise RuntimeError('Existing evidence is immutable; select a new phase')
data=json.loads((source/'results.json').read_text(encoding='utf8')); registrations=[]
refs={'REF-01':('15.png',(585,197,1229,803)),'REF-02':('16.png',(308,206,1643,663)),'REF-03':('17.png',(593,152,1229,832)),'REF-04':('18.png',(38,282,954,1585)),'REF-05':('19.png',(128,490,865,1343)),'REF-06':('20.png',(160,525,832,1322)),'REF-07':('21.png',(146,513,846,1418)),'REF-08':('22.png',(585,163,1228,847))}
for row in data['results']:
 for state in row['states']:
  name=row['profile']['name']+'-'+state['state']; dest=out/name;dest.mkdir(exist_ok=True); filename,roi=refs[state['ref']]; original=task/'design/references'/filename
  reference=Image.open(original).convert('RGB').crop(roi); reference.save(dest/'reference-scope.png')
  actualfile=root/state['path']; full=Image.open(actualfile).convert('RGB'); dpr=row['profile']['dpr']; selector='.s12-list' if state['state']=='list' else 'dialog[open]'; box=state['metrics']['elements'][selector][0]
  actualroi=(round(box['x']*dpr),round(box['y']*dpr),round(box['right']*dpr),round(box['bottom']*dpr)); actual=full.crop(actualroi);actual.save(dest/'actual-scope.png')
  scale=actual.width/reference.width; projected=reference.height*scale; aligned=reference.resize((actual.width,round(projected)),Image.Resampling.LANCZOS); size=(actual.width,max(actual.height,aligned.height)); r=Image.new('RGB',size,'white');a=r.copy();r.paste(aligned,(0,0));a.paste(actual,(0,0));r.save(dest/'reference-aligned.png');a.save(dest/'actual-aligned.png');Image.blend(r,a,.5).save(dest/'overlay.png');ImageEnhance.Contrast(ImageChops.difference(r,a)).enhance(3).save(dest/'diff-x3.png')
  preview=Image.new('RGB',(size[0]*2+24,size[1]+34),'#edf1f5');preview.paste(r,(0,34));preview.paste(a,(size[0]+24,34));draw=ImageDraw.Draw(preview);draw.text((8,10),'REFERENCE (uniform width scaling)',fill='black');draw.text((size[0]+32,10),row['scenario']+' / '+row['profile']['name'],fill='black');preview.thumbnail((1500,2000));preview.save(dest/'review-board.png')
  registrations.append({'profile':row['profile'],'state':state['state'],'referenceId':state['ref'],'scenario':row['scenario'],'candidateSHA':row['sourceStart']['head'],'sourcePath':state['path'],'referencePath':str(original.relative_to(root)),'referenceSHA256':hashlib.sha256(original.read_bytes()).hexdigest(),'referenceROI':roi,'actualSHA256':hashlib.sha256(actualfile.read_bytes()).hexdigest(),'actualROI':actualroi,'actualCSSBounds':box,'uniformWidthScale':scale,'heightResidualCSS':(actual.height-projected)/dpr,'registration':'Uniform width scale only; component top-left anchor; canvas padding. No vertical stretch. Excludes modal backdrop/protected shell and desktop empty illustration.','assessment':'DIAGNOSTIC; source CSS viewport/DPR missing; actual normal data differs from artwork. No pixel threshold or exact CSS acceptance inferred.'})
(out/'registration.json').write_text(json.dumps(registrations,indent=2),encoding='utf8');print(json.dumps({'phase':phase,'sets':len(registrations),'out':str(out)}))
