from pathlib import Path
import json, hashlib, subprocess
task=Path.cwd()/'docs/quality/uiux-task-HN-S27-005';visual=task/'visual'
git=lambda *args:subprocess.check_output(['git',*args],text=True).strip()
sha=git('rev-parse','HEAD')
if sha!='ebcf0d360e52bf2036c5a3c531563675ebf3580c' or git('status','--porcelain','--','src','tests'):raise RuntimeError('Final source custody gate')
manifest=visual/'FINAL_CAPTURE_MANIFEST.json'
if manifest.exists():raise RuntimeError('Frozen manifest exists')
receipt_paths=['final-normal-ebcf0d3/results.json','final-synthetic-ebcf0d3/results.json','final-synthetic-tablet-retry-ebcf0d3/results.json']
profiles=[]
for rp in receipt_paths:
    receipt=json.loads((visual/rp).read_text(encoding='utf-8'))
    for row in receipt['results']:
        if row['result']!='CAPTURED':continue
        profiles.append({'receipt':rp,'profile':row['profile'],'scenario':row['environment'],'sha':row['sourceStart']['head'],'count':row['list']['resultCount'],'exactEventId':row['eventDiscovery']['exactId'],'sourceReceipt':row.get('sourceReceipt'),'copyTargets':[(v['width'],v['height'],v['border']) for v in row['modalDiagnostics']['copyTargets']],'labelOverlapCount':sum(len(c['overlaps']) for c in row['list']['presentation']['cardMetadata']),'cardFieldCounts':[len(c['labels']) for c in row['list']['presentation']['cardMetadata']],'footerReachable':row['modalDiagnostics']['footerReachable'],'horizontalOverflow':row['modalDiagnostics']['horizontalOverflow'],'scrolled':row['scrolledDiagnostics'],'errors':len(row['errors']),'networkFailures':len(row['networkFailures']),'stableSourceCustody':row['stable']})
assets=[]
for file in sorted(visual.rglob('*')):
    if file.is_file() and file!=manifest:assets.append({'path':str(file.relative_to(task)).replace('\\','/'),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
for file in [task/'VISUAL_QA_REPORT.md',task/'VISUAL_DEFECT_REGISTER.md']:
    assets.append({'path':file.name,'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
output={'finalSourceSHA':sha,'sourceTree':git('rev-parse','HEAD:src'),'testsTree':git('rev-parse','HEAD:tests'),'sourceStatus':git('status','--porcelain','--','src','tests'),'runtimeModel':'UNVERIFIED','verdict':'PARTIAL; V07 OPEN P2 desktop modal geometry; exact authority gaps; no P0/P1 observed','profiles':profiles,'nativeTransfer':{'fromSHA':'d80255b94a3d6ad37e7c65eb34bb4f075e48deaf','toSHA':sha,'method':'Source diff exactly one card dt white-space declaration. Native screenshots retain original SHA; affected800 recaptured; native transfer is not final-native independent browser execution.'},'assets':assets,'freeze':'Owned visual assets and two reports frozen after this manifest. Do not overwrite captures/references or relabel historical SHAs.'}
manifest.write_text(json.dumps(output,indent=2,ensure_ascii=False),encoding='utf-8')
print(json.dumps({'manifest':str(manifest),'profiles':len(profiles),'assets':len(assets),'sha':sha}))
