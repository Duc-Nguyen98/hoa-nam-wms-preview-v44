$ErrorActionPreference = 'Stop'
$repoRoot = 'E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026'
Set-Location -LiteralPath $repoRoot
$auditRoot = Join-Path $repoRoot 'docs/quality/uiux-task-HN-S01-004/release/f56e25c-postpush'
$api = 'https://api.github.com/repos/Duc-Nguyen98/hoa-nam-wms-preview-v44'
$headers = @{'User-Agent'='HoaNam-Release-Audit'}
function Read-Api($suffix) {
  try { return @{path=$suffix;ok=$true;value=(Invoke-RestMethod ($api+$suffix) -Headers $headers)} }
  catch { return @{path=$suffix;ok=$false;error=$_.Exception.Message} }
}
$sha = (git rev-parse HEAD).Trim()
$runs = Read-Api '/actions/runs?branch=DEV&per_page=4'
$candidateRun = @($runs.value.workflow_runs | Where-Object head_sha -eq $sha)[0]
$checks = Read-Api ('/commits/'+$sha+'/check-runs')
$annotations = @()
foreach($check in @($checks.value.check_runs)) {
  if($check.output.annotations_count -gt 0) { $annotations += Read-Api ('/check-runs/'+$check.id+'/annotations') }
}
$github = [ordered]@{
  observedAtUtc=[DateTimeOffset]::UtcNow.ToString('o');head=$sha;branch=(git branch --show-current).Trim();srcTree=(git rev-parse HEAD:src).Trim();remoteRefs=@(git ls-remote github refs/heads/DEV refs/heads/main)
  branchObservation=(Read-Api '/branches/DEV');rulesets=(Read-Api '/rulesets');protection=(Read-Api '/branches/DEV/protection');pullRequest=(Read-Api '/pulls/1');runs=$runs;checks=$checks;annotations=$annotations
  jobs=$(if($candidateRun){Read-Api ('/actions/runs/'+$candidateRun.id+'/jobs')}else{$null})
  workflowSha256=(Get-FileHash .github/workflows/quality-pr.yml -Algorithm SHA256).Hash.ToLowerInvariant();trackedTrayReferenceFiles=@(git ls-files output/tray-approved/reference)
}
$github | ConvertTo-Json -Depth 18 | Set-Content -LiteralPath (Join-Path $auditRoot 'github-observation.json') -Encoding utf8
$previewBase = 'https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site'
$http = [System.Net.Http.HttpClient]::new()
$http.Timeout = [TimeSpan]::FromSeconds(40)
try {
  $manifestBytes = $http.GetByteArrayAsync($previewBase+'/build-info.json').GetAwaiter().GetResult()
  $manifest = [System.Text.Encoding]::UTF8.GetString($manifestBytes) | ConvertFrom-Json
  $assetChecks = @()
  foreach($asset in $manifest.assets) {
    try {
      $bytes=$http.GetByteArrayAsync($previewBase+'/'+$asset.path).GetAwaiter().GetResult()
      $actualHash=[Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()
      $assetChecks += [ordered]@{path=$asset.path;expectedSha256=$asset.sha256;actualSha256=$actualHash;expectedBytes=$asset.bytes;actualBytes=$bytes.Length;matches=($actualHash -eq $asset.sha256 -and $bytes.Length -eq $asset.bytes)}
    } catch { $assetChecks += @{path=$asset.path;matches=$false;error=$_.Exception.Message} }
  }
  $preview=[ordered]@{observedAtUtc=[DateTimeOffset]::UtcNow.ToString('o');url=$previewBase;manifest=$manifest;assetChecks=$assetChecks;allListedAssetsMatch=(@($assetChecks|Where-Object {-not $_.matches}).Count -eq 0);candidateSha=$sha;candidateSrcTree=$github.srcTree;provenanceStatus='UNVERIFIED_CURRENT_CANDIDATE';reason='Build writer copies historical SOURCE_PROVENANCE.sourceCommit; manifest is not trusted candidate SHA attestation. HTTP transport or injected bytes may change individual assets.'}
  $preview | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $auditRoot 'preview-observation.json') -Encoding utf8
} finally { $http.Dispose() }
$refs = @()
foreach($name in @('3.png','4.png','5.png','6.png')) {
  $original='C:/Users/Admin/Desktop/HN_Astra/'+$name
  $custody='docs/quality/references/hn-astra-20261027/'+$name
  $a=(Get-FileHash -LiteralPath $original -Algorithm SHA256).Hash.ToLowerInvariant()
  $b=(Get-FileHash -LiteralPath $custody -Algorithm SHA256).Hash.ToLowerInvariant()
  $refs += @{original=$original;custody=$custody;originalSha256=$a;custodySha256=$b;matches=($a -eq $b)}
}
$refs | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $auditRoot 'reference-integrity.json') -Encoding utf8
[ordered]@{head=$sha;candidateRun=$candidateRun.id;github='github-observation.json';preview='preview-observation.json';referenceIntegrity='reference-integrity.json';assetPass=@($assetChecks|Where-Object matches).Count;assetFail=@($assetChecks|Where-Object {-not $_.matches}).Count} | ConvertTo-Json -Compress


