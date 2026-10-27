"""Diagnostic native-raster comparison; immutable originals retained, shell excluded."""
from PIL import Image, ImageChops, ImageEnhance
from pathlib import Path
import json, hashlib, shutil
import os
root=Path(os.environ.get('VQ_OUT',str(Path(__file__).parent)))
rows=[]
for name, filename, rect in [('desktop-native','1.png',(390,113,1477,841)),('tablet-native','2.png',(61,261,942,1523))]:
    source=Path('C:/Users/Admin/Desktop/HN_Astra')/filename
    ref=Image.open(source).convert('RGB')
    shutil.copyfile(source,root/f'{name}-reference.png')
    actual_path=root/f'{name}-after.png'
    if not actual_path.exists():
        rows.append({'profile':name,'status':'BLOCKED_NO_ACTUAL'});continue
    actual=Image.open(actual_path).convert('RGB')
    a=actual.crop(rect); r=ref.crop(rect)
    r.save(root/f'{name}-reference-modal-crop.png');a.save(root/f'{name}-actual-modal-crop.png')
    Image.blend(r,a,.5).save(root/f'{name}-overlay.png')
    d=ImageChops.difference(r,a);ImageEnhance.Contrast(d).enhance(3).save(root/f'{name}-diff-x3.png')
    values=list(d.getdata());n=len(values)
    rows.append({'profile':name,'status':'DIAGNOSTIC_DIFF','referenceSize':ref.size,'actualSize':actual.size,'scopeCrop':rect,'transforms':'Native pixels; no resampling; same rectangle in both full images; diff amplified3 for display only','meanAbsoluteChannelError':sum(sum(v) for v in values)/(n*3),'pixelFractionAnyChannelDeltaAbove10':sum(max(v)>10 for v in values)/n,'approvalTolerance':'UNSPECIFIED; metrics are not an acceptance threshold','referenceSHA256':hashlib.sha256(source.read_bytes()).hexdigest()})
(root/'comparison-metrics.json').write_text(json.dumps(rows,indent=2),encoding='utf8')
print(json.dumps(rows,indent=2))

