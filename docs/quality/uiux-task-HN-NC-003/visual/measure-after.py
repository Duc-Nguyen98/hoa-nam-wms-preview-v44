"""Independent after geometry, paint and preservation checks. No baseline writes."""
from pathlib import Path
from PIL import Image, ImageChops
import json, os

root = Path(os.environ['VQ_OUT'])
capture = json.loads((root/'capture-results.json').read_text(encoding='utf-8-sig'))
before_root = root.parent/'wall-clock'
before = json.loads((before_root/'capture-results.json').read_text(encoding='utf-8-sig'))
rows = []
for row in capture['results']:
    cfg = row['profile']
    if row['result'] != 'CAPTURED':
        rows.append({'profile':cfg,'result':row['result'],'failure':row.get('failure')})
        continue
    m = row['after']['modal']
    close = row['after']['elements']['.hn-global-modal__close']
    dpr = cfg['dpr']
    image = Image.open(root/f"{cfg['name']}-after.png").convert('RGB')
    crop = image.crop(tuple(round(v*dpr) for v in (close['x'],close['y'],close['x']+close['width'],close['y']+close['height'])))
    paint = crop.convert('L').point(lambda p:255 if p<200 else 0).getbbox()
    crop.save(root/f"{cfg['name']}-close-paint.png")
    record = {'profile':cfg,'modal':{k:m[k] for k in ['x','y','width','height']},
              'edges':{'left':m['x'],'top':m['y'],'right':cfg['width']-m['x']-m['width'],'bottom':cfg['height']-m['y']-m['height']},
              'modalFullyInsideViewport':m['x']>=0 and m['y']>=0 and m['x']+m['width']<=cfg['width']+.1 and m['y']+m['height']<=cfg['height']+.1,
              'closeHitTargetCSS':{'width':close['width'],'height':close['height']},
              'closePaintRasterBounds':paint,'closePaintRasterSize':None if paint is None else [paint[2]-paint[0],paint[3]-paint[1]],
              'horizontalOverflow':row['after']['horizontalOverflow'],'bodyOverflow':row['after']['bodyOverflow'],
              'detailHorizontalOverflow':row.get('detail',{}).get('horizontalOverflow'),
              'searchCount':row.get('searchCount'),'unreadFilterCount':row.get('unreadFilterCount'),
              'focusRestored':row.get('focusRestored'),'closeFocus':row.get('closeFocus'),
              'consoleErrors':len(row['errors']),'networkErrors':len(row['requests']),
              'runtimeSourceClean':row.get('runtimeSourceClean')}
    if row.get('afterReadList'):
        stages = ['listBeforeDetail','afterReadList','afterUnreadList']
        record['rowDensityAcrossReadStates'] = {
            stage:[{'id':i['id'],**{k:i['box'][k] for k in ['x','y','width','height']}} for i in row[stage]['items']]
            for stage in stages}
        initial=record['rowDensityAcrossReadStates']['listBeforeDetail']
        record['rowDensityUnchangedReadUnreadBack']=all(
            record['rowDensityAcrossReadStates'][stage]==initial for stage in stages[1:])
    original = next((r for r in before['results'] if r['profile']['name']==cfg['name']),None)
    if original:
        record['geometryChangeFromBefore']={k:m[k]-original['before']['modal'][k] for k in ['x','y','width','height']}
        original_image=Image.open(before_root/f"{cfg['name']}-before.png").convert('RGB')
        diff=ImageChops.difference(original_image,image)
        record['beforeAfterFullRasterIdentical']=diff.getbbox() is None
        diff.save(root/f"{cfg['name']}-before-after-diff.png")
    rows.append(record)
(root/'geometry-paint-summary.json').write_text(json.dumps({'sha':capture['sha'],'endedSha':capture.get('endedSha'),'rows':rows},indent=2),encoding='utf-8')
print(json.dumps(rows,indent=2))
