"""Formal scoped comparison: uniform width scale, top-left registration, canvas padding.

The historical compare.py output remains diagnostic only. No geometry is stretched
to hide a height discrepancy. Every geometric residual is explicit in registration.
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance
import json, hashlib, sys, shutil

root=Path.cwd(); task=root/'docs/quality/uiux-task-HN-S27-005'
phase=sys.argv[1] if len(sys.argv)>1 else 'before-synthetic'
source=task/'visual'/phase
results=json.loads((source/'results.json').read_text(encoding='utf-8'))
out=task/'visual'/f'{phase}-isotropic'
out.mkdir(exist_ok=True)
if (out/'registration.json').exists(): raise RuntimeError('Preserve existing formal evidence; select a fresh output phase')
refs={'desktop-list':('9.png',(292,230,1647,915)), 'tablet-list':('10.png',(27,416,967,1547)), 'desktop-modal':('11.png',(484,115,1305,875)), 'tablet-modal':('12.png',(108,314,884,1470))}
manifest=[]
for row in results['results']:
    if row['result']!='CAPTURED': continue
    profile=row['profile']['name']; device=profile.split('-')[0]; dpr=row['profile']['dpr']
    for state in ['list','modal']:
        name=f'{profile}-{state}'; dest=out/name;dest.mkdir(exist_ok=True)
        refname,roi=refs[f'{device}-{state}'];original=Path('C:/Users/Admin/Desktop/HN_Astra')/refname
        shutil.copyfile(original,dest/'reference-full.png')
        reference=Image.open(original).convert('RGB').crop(roi);reference.save(dest/'reference-scope.png')
        actualfile=source/f'{profile}-{state if state=="modal" else "list-full"}.png'
        actual=Image.open(actualfile).convert('RGB');shutil.copyfile(actualfile,dest/'actual-full.png')
        selector='.s27-list' if state=='list' else 'dialog.s27-detail-modal';box=row[state]['elements'][selector][0]
        crop=tuple(round(box[k]*dpr) for k in ['x','y'])+tuple(round((box[k]+box[size])*dpr) for k,size in [('x','width'),('y','height')])
        scoped=actual.crop(crop);scoped.save(dest/'actual-scope.png')
        scale=scoped.width/reference.width
        projected_height=reference.height*scale
        aligned=reference.resize((scoped.width,round(projected_height)),Image.Resampling.LANCZOS)
        canvas_size=(scoped.width,max(scoped.height,aligned.height))
        ref_canvas=Image.new('RGB',canvas_size,'white');ref_canvas.paste(aligned,(0,0))
        actual_canvas=Image.new('RGB',canvas_size,'white');actual_canvas.paste(scoped,(0,0))
        ref_canvas.save(dest/'reference-aligned.png');actual_canvas.save(dest/'actual-aligned.png')
        Image.blend(ref_canvas,actual_canvas,.5).save(dest/'overlay.png')
        ImageEnhance.Contrast(ImageChops.difference(ref_canvas,actual_canvas)).enhance(3).save(dest/'diff-x3.png')
        manifest.append({'name':name,'phase':phase,'scenario':row['environment'],'sourceSHA':row['sourceStart']['head'],'reference':str(original),'referenceSHA256':hashlib.sha256(original.read_bytes()).hexdigest(),'referenceROI':roi,'referenceScopedRasterSize':reference.size,'actualSource':str(actualfile.relative_to(root)),'actualSHA256':hashlib.sha256(actualfile.read_bytes()).hexdigest(),'actualROI':crop,'actualCSSBounds':box,'actualDPR':dpr,'actualScopedRasterSize':scoped.size,'registration':'FORMAL: isotropic width scale only, top-left component anchor, white canvas padding; no height stretch or source CSS viewport/DPR inference','uniformScale':scale,'referenceProjectedHeightRaster':projected_height,'heightResidualActualMinusReferenceRaster':scoped.height-projected_height,'heightResidualActualMinusReferenceCSS':(scoped.height-projected_height)/dpr,'canvasSize':canvas_size,'assessment':'NO_PIXEL_PASS; dynamic fixture content differs; modal shell excluded; geometry deviations retained'})
(out/'registration.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps({'phase':phase,'formalComparisonSets':len(manifest),'output':str(out)}))
