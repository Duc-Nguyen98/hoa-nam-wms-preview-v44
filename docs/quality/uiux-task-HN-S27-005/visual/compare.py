"""Evidence-only scoped raster registration. Never asserts a pixel pass."""
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance
import json, hashlib, sys

root=Path.cwd()
task=root/'docs/quality/uiux-task-HN-S27-005'
phase=sys.argv[1] if len(sys.argv)>1 else 'before-synthetic'
source=task/'visual'/phase
results=json.loads((source/'results.json').read_text(encoding='utf-8'))
out=task/'visual'/f'{phase}-comparisons'
out.mkdir(exist_ok=True)
refs={'desktop-list':('9.png',(292,230,1647,915)), 'tablet-list':('10.png',(27,416,967,1547)), 'desktop-modal':('11.png',(484,115,1305,875)), 'tablet-modal':('12.png',(108,314,884,1470))}
manifest=[]
for row in results['results']:
    if row['result']!='CAPTURED': continue
    profile=row['profile']['name']; device=profile.split('-')[0]; dpr=row['profile']['dpr']
    for state in ['list','modal']:
        name=f'{profile}-{state}'; dest=out/name;dest.mkdir(exist_ok=True)
        refname,roi=refs[f'{device}-{state}']
        original=Path('C:/Users/Admin/Desktop/HN_Astra')/refname
        ref=Image.open(original).convert('RGB')
        ref.save(dest/'reference-full.png')
        reference=ref.crop(roi);reference.save(dest/'reference-scope.png')
        actualfile=source/f'{profile}-{state if state=="modal" else "list-full"}.png'
        actual=Image.open(actualfile).convert('RGB');actual.save(dest/'actual-full.png')
        selector='.s27-list' if state=='list' else 'dialog.s27-detail-modal'
        box=row[state]['elements'][selector][0]
        crop=tuple(round(box[k]*dpr) for k in ['x','y'])+tuple(round((box[k]+box[size])*dpr) for k,size in [('x','width'),('y','height')])
        scoped=actual.crop(crop);scoped.save(dest/'actual-scope.png')
        # Independent x/y scale aligns component edges only, deliberately retaining
        # every internal position discrepancy and excluding modal backdrops.
        aligned=reference.resize(scoped.size,Image.Resampling.LANCZOS)
        aligned.save(dest/'reference-aligned.png')
        Image.blend(aligned,scoped,0.5).save(dest/'overlay.png')
        diff=ImageChops.difference(aligned,scoped)
        ImageEnhance.Contrast(diff).enhance(3).save(dest/'diff-x3.png')
        manifest.append({'name':name,'phase':phase,'scenario':row['environment'],'sourceSHA':row['sourceStart']['head'],'reference':str(original),'referenceSHA256':hashlib.sha256(original.read_bytes()).hexdigest(),'referenceROI':roi,'actualSource':str(actualfile.relative_to(root)),'actualROI':crop,'actualScopedRasterSize':scoped.size,'registration':'Component ROI edges, independent x/y scale, Lanczos; no source CSS viewport/DPR inference','scaleX':scoped.width/reference.width,'scaleY':scoped.height/reference.height,'assessment':'DIAGNOSTIC_ONLY_NO_PIXEL_PASS; dynamic fixture content differs; modal shell excluded'})
(out/'registration.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps({'phase':phase,'comparisonSets':len(manifest),'output':str(out)}))
