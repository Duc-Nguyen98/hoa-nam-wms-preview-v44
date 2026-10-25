"""Diagnostic artwork comparison. Never updates originals or treats pixel ratio as PASS."""
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance
import json, hashlib
root=Path(r'W:/WMS_HoaNam/Scanner_CMS/output/notification-p0-20261025')
report={'method':'Manual modal bounds from approved artwork; normalize modal crop to actual modal raster. No page/background comparison, no similarity PASS. Original SHA256 locked. All nonzero pixel changes shown; font antialiasing is not separated by algorithm.','profiles':{},'classification':{'structural':'DOM metrics and independent QA required','typography':'locked Public Sans; exact artwork font unavailable; inspect overlay','spacing':'compare normalized boundaries and DOM metrics','semantic':'semantic icon/color inspected independently','rendering':'artwork raster scaling and browser font rasterization cause nonzero differences; not a design waiver'}}
for name,original,bounds in [('desktop','desktop-reference-original.png',(390,114,1476,842)),('tablet','tablet-reference-original.png',(61,262,942,1524))]:
    folder=root/name;folder.mkdir(exist_ok=True)
    source=Image.open(root/original).convert('RGB');actual=Image.open(root/f'{name}-after-modal.png').convert('RGB')
    crop=source.crop(bounds);baseline=crop.resize(actual.size,Image.Resampling.LANCZOS)
    baseline.save(folder/'baseline.png');actual.save(folder/'actual.png')
    delta=ImageChops.difference(baseline,actual)
    ImageEnhance.Contrast(delta).enhance(3).save(folder/'diff.png')
    Image.blend(baseline,actual,0.5).save(folder/'overlay.png')
    report['profiles'][name]={'source':original,'sourceSha256':hashlib.sha256((root/original).read_bytes()).hexdigest(),'originalRaster':source.size,'cropRasterBounds':bounds,'comparisonRaster':actual.size,'cropScale':(actual.width/crop.width,actual.height/crop.height),'diffDisplay':'absolute RGB difference enhanced x3 for visibility; no masking/threshold','acceptance':'Independent structural + typography + spacing + semantic QA, not pixel similarity'}
(root/'visual-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
