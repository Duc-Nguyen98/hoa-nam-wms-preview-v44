"""Assemble four formal reference/BEFORE/AFTER review sets from saved captures."""
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance, ImageDraw, ImageFont
import json, sys

task=Path.cwd()/'docs/quality/uiux-task-HN-S27-005';visual=task/'visual'
after_phase=sys.argv[1];before=visual/'before-synthetic-isotropic';after=visual/f'{after_phase}-isotropic'
bm={r['name']:r for r in json.loads((before/'registration.json').read_text())}
am={r['name']:r for r in json.loads((after/'registration.json').read_text())}
sources={name:after/name for name in am}
if len(sys.argv)>2:
    supplement=visual/f'{sys.argv[2]}-isotropic'
    for r in json.loads((supplement/'registration.json').read_text()):
        am[r['name']]=r;sources[r['name']]=supplement/r['name']
sha=next(iter(am.values()))['sourceSHA'];out=visual/f'final-review-{sha[:7]}'
out.mkdir(exist_ok=True)
if (out/'registration.json').exists(): raise RuntimeError('Final review already exists; preserve evidence')
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',24)
receipts=[]
for name in ['desktop-list','tablet-list','desktop-modal','tablet-modal']:
    dest=out/name;dest.mkdir(exist_ok=True)
    reference=Image.open(sources[name]/'reference-scope.png').convert('RGB')
    previous=Image.open(before/name/'actual-scope.png').convert('RGB')
    candidate=Image.open(sources[name]/'actual-scope.png').convert('RGB')
    width=candidate.width
    scale=width/reference.width;reference=reference.resize((width,round(reference.height*scale)),Image.Resampling.LANCZOS)
    before_scale=width/previous.width;previous=previous.resize((width,round(previous.height*before_scale)),Image.Resampling.LANCZOS)
    height=max(reference.height,previous.height,candidate.height)
    canvases=[]
    for label,picture in [('reference',reference),('before',previous),('after',candidate)]:
        canvas=Image.new('RGB',(width,height),'white');canvas.paste(picture,(0,0));canvas.save(dest/f'{label}-aligned.png');canvases.append(canvas)
    ref_canvas,before_canvas,after_canvas=canvases
    for label,left,right in [('reference-before',ref_canvas,before_canvas),('reference-after',ref_canvas,after_canvas),('before-after',before_canvas,after_canvas)]:
        Image.blend(left,right,.5).save(dest/f'{label}-overlay.png')
        ImageEnhance.Contrast(ImageChops.difference(left,right)).enhance(3).save(dest/f'{label}-diff-x3.png')
    board=Image.new('RGB',(width*3+16,height+48),'#eef2f6');draw=ImageDraw.Draw(board)
    for i,(label,canvas) in enumerate(zip(['REFERENCE — width-scaled uniformly','BEFORE — bde0e429',f'AFTER — {sha[:7]}'],canvases)):
        x=i*(width+8);draw.text((x+8,10),label,font=font,fill='#153451');board.paste(canvas,(x,48))
    board.save(dest/'reference-before-after.png')
    receipts.append({'name':name,'sourceBeforeSHA':bm[name]['sourceSHA'],'sourceAfterSHA':sha,'scenario':'QA_SYNTHETIC existing immutable3-event harness; actual normal62-event route separately evidenced','beforeCapture':bm[name]['actualSource'],'afterCapture':am[name]['actualSource'],'referenceOriginal':am[name]['reference'],'referenceSHA256':am[name]['referenceSHA256'],'registration':'Top-left component ROI; uniform width scaling only; canvas padded to maximum height; no anisotropic transforms','referenceUniformScale':scale,'beforeUniformScale':before_scale,'beforeHeightResidualCSS':bm[name]['heightResidualActualMinusReferenceCSS'],'afterHeightResidualCSS':am[name]['heightResidualActualMinusReferenceCSS'],'canvasRasterSize':[width,height],'verdict':'Bounded defect retest only; exact fidelity DESIGN_GAP, no pixelPASS'})
(out/'registration.json').write_text(json.dumps(receipts,indent=2),encoding='utf-8')
print(json.dumps({'finalSets':len(receipts),'sha':sha,'output':str(out)}))
