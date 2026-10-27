$ErrorActionPreference = 'Stop'
$repoRoot = 'E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026'
Set-Location -LiteralPath $repoRoot
$out = 'docs/quality/uiux-task-HN-S01-004/release/f56e25c-prestorage'
$api = 'https://api.github.com'
$repo = '/repos/Duc-Nguyen98/hoa-nam-wms-preview-v44'
$headers = @{'User-Agent'='HoaNam-S01-ReadOnly-Audit'}
$credentialLines = "protocol=https`nhost=github.com`n`n" | git credential fill 2>$null
$secret = $null
foreach($line in $credentialLines) { if($line.StartsWith('password=')) { $secret=$line.Substring(9) } }
$credentialLines = $null
if($secret) { $headers.Authorization = 'Bearer '+$secret }
function Read-Api($path) {
  try { return @{path=$path;ok=$true;value=(Invoke-RestMethod ($api+$path) -Headers $headers)} }
  catch { return @{path=$path;ok=$false;error=$_.Exception.Message} }
}
$identity = Read-Api '/user'
$repoRead = Read-Api $repo
$sha = (git rev-parse HEAD).Trim()
$result = [ordered]@{
  observedAtUtc=[DateTimeOffset]::UtcNow.ToString('o')
  authentication=@{credentialAvailable=[bool]$secret;userReadOk=$identity.ok;login=$identity.value.login;error=$identity.error;repositoryPermissions=$repoRead.value.permissions}
  protection=(Read-Api ($repo+'/branches/DEV/protection'))
  rulesets=(Read-Api ($repo+'/rulesets'))
  branch=(Read-Api ($repo+'/branches/DEV'))
  openPullRequests=(Read-Api ($repo+'/pulls?state=open&per_page=100'))
  combinedStatus=(Read-Api ($repo+'/commits/'+$sha+'/status'))
  sha=$sha
  protectedBytes=@(Get-Content 'docs/quality/uiux-task-HN-S01-004/PROTECTED_SOURCE_BEFORE.json' -Raw | ConvertFrom-Json | ForEach-Object {
    $actual = (Get-FileHash -LiteralPath $_.path -Algorithm SHA256).Hash.ToLowerInvariant()
    @{path=$_.path;expectedSha256=$_.sha256;actualSha256=$actual;matches=($actual -eq $_.sha256)}
  })
  workingStatus=@(git status --short)
}
$result | ConvertTo-Json -Depth 22 | Set-Content -LiteralPath "$out/github-supplement.json" -Encoding utf8
$headers.Remove('Authorization')
$secret = $null
[ordered]@{sha=$sha;authenticated=$result.authentication.userReadOk;permissions=$result.authentication.repositoryPermissions;protected=$result.branch.value.protected;protectionOk=$result.protection.ok;rulesetsOk=$result.rulesets.ok;openPrCount=@($result.openPullRequests.value).Count;protectedByteCount=$result.protectedBytes.Count;protectedMismatches=@($result.protectedBytes|Where-Object {-not $_.matches}).Count} | ConvertTo-Json -Compress

