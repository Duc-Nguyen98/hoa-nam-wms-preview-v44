$ErrorActionPreference='Stop'
Set-Location -LiteralPath 'E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026'
$out='docs/quality/uiux-task-HN-S27-005/release'
$api='https://api.github.com'
$repo='/repos/Duc-Nguyen98/hoa-nam-wms-preview-v44'
$headers=@{'User-Agent'='HoaNam-S27-ReadOnly-Release-Audit'}
$credentialLines="protocol=https`nhost=github.com`n`n" | git credential fill 2>$null
$secret=$null
foreach($line in $credentialLines){if($line.StartsWith('password=')){$secret=$line.Substring(9)}}
$credentialLines=$null
if($secret){$headers.Authorization='Bearer '+$secret}
function Read-Api($path){
  try {@{ok=$true;path=$path;value=(Invoke-RestMethod ($api+$path) -Headers $headers -TimeoutSec 25)}}
  catch {@{ok=$false;path=$path;error=$_.Exception.Message;detail=$_.ErrorDetails.Message}}
}
$sha=(git rev-parse HEAD).Trim()
$identity=Read-Api '/user'
$repository=Read-Api $repo
$runs=Read-Api ($repo+'/actions/runs?head_sha='+$sha+'&per_page=5')
$run=@($runs.value.workflow_runs|Where-Object head_sha -eq $sha)[0]
$checks=Read-Api ($repo+'/commits/'+$sha+'/check-runs')
$annotations=@()
foreach($check in @($checks.value.check_runs)){if($check.output.annotations_count -gt 0){$annotations+=Read-Api ($repo+'/check-runs/'+$check.id+'/annotations')}}
$result=[ordered]@{
 observedAtUtc=[DateTimeOffset]::UtcNow.ToString('o');candidateStatus='NOT_COMMITTED_SOURCE_DIRTY';head=$sha
 authentication=@{credentialAvailable=[bool]$secret;userReadOk=$identity.ok;login=$identity.value.login;repositoryPermissions=$repository.value.permissions}
 workingStatus=@(git status --short);remoteRefs=@(git ls-remote github refs/heads/DEV refs/heads/main)
 branchDEV=(Read-Api ($repo+'/branches/DEV'));branchMain=(Read-Api ($repo+'/branches/main'))
 protectionDEV=(Read-Api ($repo+'/branches/DEV/protection'));protectionMain=(Read-Api ($repo+'/branches/main/protection'))
 rulesets=(Read-Api ($repo+'/rulesets'));openPullRequests=(Read-Api ($repo+'/pulls?state=open&per_page=100'))
 baseRuns=$runs;baseChecks=$checks;baseAnnotations=$annotations
 baseJobs=$(if($run){Read-Api ($repo+'/actions/runs/'+$run.id+'/jobs')}else{$null})
 workflowSha256=(Get-FileHash .github/workflows/quality-pr.yml -Algorithm SHA256).Hash.ToLowerInvariant()
 pushPerformed=$false;productionMergeOrDeployPerformed=$false;actualModelTelemetry='UNVERIFIED'
}
$result|ConvertTo-Json -Depth 24|Set-Content -LiteralPath "$out/initial-github-observation.json" -Encoding utf8
$headers.Remove('Authorization');$secret=$null
$preview='https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site'
try {
 $manifest=Invoke-RestMethod ($preview+'/build-info.json') -TimeoutSec 30
 $observation=@{observedAtUtc=[DateTimeOffset]::UtcNow.ToString('o');url=$preview+'/#/preview/S27';manifest=$manifest;candidateSha=$null;localHead=$sha;status='UNVERIFIED_CURRENT_CANDIDATE';reason='No committed S27 candidate. Build writer copies historical SOURCE_PROVENANCE.sourceCommit; manifest alone does not attest current source.'}
}catch{$observation=@{url=$preview;status='BLOCKED';error=$_.Exception.Message}}
$observation|ConvertTo-Json -Depth 15|Set-Content -LiteralPath "$out/initial-preview-observation.json" -Encoding utf8
[ordered]@{head=$sha;authentication=$result.authentication;DEV=$result.branchDEV.value.commit.sha;main=$result.branchMain.value.commit.sha;DEVProtected=$result.branchDEV.value.protected;mainProtected=$result.branchMain.value.protected;rulesets=$result.rulesets;protectionDEV=$result.protectionDEV;protectionMain=$result.protectionMain;openPrCount=@($result.openPullRequests.value).Count;baseRunId=$run.id;baseRunConclusion=$run.conclusion;annotations=$annotations.value;previewSourceCommit=$manifest.sourceCommit;previewStatus=$observation.status}|ConvertTo-Json -Depth 8
