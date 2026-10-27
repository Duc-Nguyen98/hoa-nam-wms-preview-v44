"""Diagnostic raster comparison; no reference mutation or acceptance threshold."""
from PIL import Image, ImageChops, ImageEnhance, ImageOps
from pathlib import Path
import json, hashlib, os
ROOT=Path(__file__).resolve().parent
PHASE=os.environ.get('VQ_COMPARE_PHASE','before')
OUT=ROOT/('comparison-'+PHASE); OUT.mkdir(exist_ok=True)
native=json.loads((ROOT/os.environ.get('VQ_NATIVE_DIR','before-native')/'capture-results.json').read_text(encoding='utf-8'))
rows={r['profile']['name']:r for r in native['results']}
dashrows={r['profile']['name']:r for r in json.loads((ROOT/os.environ['VQ_DASHBOARD_DIR']/'capture-results.json').read_text(encoding='utf-8'))['results']} if os.environ.get('VQ_DASHBOARD_DIR') else rows
cases=[
 ('dashboard-desktop','3.png','desktop-native','dashboard-full',[304,80,1640,933],[304,82,1640,962]),
 ('dashboard-tablet','4.png','tablet-native','dashboard-full',[46,289,947,1536],[46,296.5,946,1576.5]),
 ('px0007-desktop','5.png','desktop-native','px0007',[484,166,1279,864],None),
 ('px0007-tablet','6.png','tablet-modal-native','px0007',[43,524,751,1855],None),
]
manifest={'purpose':'Diagnostic only; source DPR/viewport and exact visual tolerance unknown. Isotropic width alignment; no full-frame PASS. Shell/header/sidebar excluded by crop.','cases':[]}
for name,refname,profile,state,refbox,actualbox in cases:
 refpath=ROOT/'references'/refname
 row=(dashrows if name.startswith('dashboard') else rows)[profile]
 if PHASE!='before' and name.startswith('dashboard'):
  el=row['dashboard']['elements'];metric=el['.ov-metrics'][0];activity=el['.ov-activity'][0]
  actualbox=[metric['x'],el['.ov-screen'][0]['y'] if name.endswith('desktop') else metric['y'],metric['right'],activity['bottom']]
 actualpath=Path(next(c['path'] for c in row['captures'] if c['state']==state))
 actualpath=Path.cwd()/actualpath
 if actualbox is None:
  b=row['modal']['elements']['dialog.ov-detail-modal'][0]
  actualbox=[b['x'],b['y'],b['right'],b['bottom']]
 ref=Image.open(refpath).convert('RGB').crop(tuple(round(x) for x in refbox))
 actual=Image.open(actualpath).convert('RGB').crop(tuple(round(x) for x in actualbox))
 ref.save(OUT/f'{name}-reference-crop.png');actual.save(OUT/f'{name}-actual-crop.png')
 scale=ref.width/actual.width
 aligned=actual.resize((ref.width,round(actual.height*scale)),Image.Resampling.LANCZOS)
 size=(ref.width,max(ref.height,aligned.height))
 rc=Image.new('RGB',size,(245,222,245));ac=rc.copy();rc.paste(ref,(0,0));ac.paste(aligned,(0,0))
 ac.save(OUT/f'{name}-actual-aligned.png')
 Image.blend(rc,ac,0.5).save(OUT/f'{name}-overlay.png')
 diff=ImageChops.difference(rc,ac);ImageEnhance.Contrast(diff).enhance(3).save(OUT/f'{name}-diff-3x.png')
 side=Image.new('RGB',(size[0]*2,size[1]),'white');side.paste(rc,(0,0));side.paste(ac,(size[0],0));side.save(OUT/f'{name}-side-by-side.png')
 hist=diff.histogram();mae=sum((i%256)*v for i,v in enumerate(hist))/(size[0]*size[1]*3)
 manifest['cases'].append({'name':name,'reference':str(refpath),'actual':str(actualpath),'source':row.get('sourceStart'),'scenario':row.get('scenario','normal'),'environment':row['environment'],'referenceCropRaster':refbox,'actualCropRaster':actualbox,'actualProfile':row['profile'],'transform':{'scaleX':scale,'scaleY':scale,'translation':'top-left crop aligned','interpolation':'Lanczos','padding':'#f5def5 indicates unmatched vertical extent'},'referenceSize':ref.size,'actualCropSize':actual.size,'alignedActualSize':aligned.size,'maeRGB0to255DiagnosticOnly':mae,'verdict':'BLOCKED_EXACT_ACCEPTANCE','manualReferenceAnchorUncertaintyRasterPx':2})
(OUT/'comparison-metadata.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
files=[]
for p in ROOT.rglob('*'):
 if p.is_file() and p.name!='artifact-manifest.json':
  files.append({'path':str(p.relative_to(ROOT)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(ROOT/'artifact-manifest.json').write_text(json.dumps({'files':files},indent=2),encoding='utf-8')
print(json.dumps(manifest,indent=2))
