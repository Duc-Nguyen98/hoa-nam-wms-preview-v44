param([Parameter(Mandatory=$true)][string]$CandidateSha,[Parameter(Mandatory=$true)][string]$OutputFolder)
$ErrorActionPreference='Stop'
Set-Location -LiteralPath 'E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026'
$api='https://api.github.com/repos/Duc-Nguyen98/hoa-nam-wms-preview-v44'
$headers=@{'User-Agent'='HoaNam-S27-Exact-CI-Audit'}
function Read-Ci($path) {
  try { @{ok=$true;path=$path;value=(Invoke-RestMethod ($api+$path) -Headers $headers -TimeoutSec 30)} }
  catch { @{ok=$false;path=$path;error=$_.Exception.Message} }
}
New-Item -ItemType Directory -Force -Path $OutputFolder | Out-Null
$runs=Read-Ci ('/actions/runs?head_sha='+$CandidateSha+'&per_page=10')
$run=@($runs.value.workflow_runs|Where-Object head_sha -eq $CandidateSha)[0]
$checks=Read-Ci ('/commits/'+$CandidateSha+'/check-runs')
$annotations=@()
foreach($check in @($checks.value.check_runs)) {
  if($check.output.annotations_count -gt 0){$annotations+=Read-Ci ('/check-runs/'+$check.id+'/annotations')}
}
$result=[ordered]@{
  observedAtUtc=[DateTimeOffset]::UtcNow.ToString('o');candidateSha=$CandidateSha
  localHead=(git rev-parse HEAD).Trim();srcTree=(git rev-parse HEAD:src).Trim();testsTree=(git rev-parse HEAD:tests).Trim()
  remoteRefs=@(git ls-remote github refs/heads/DEV refs/heads/main)
  runs=$runs;checks=$checks;annotations=$annotations
  jobs=$(if($run){Read-Ci ('/actions/runs/'+$run.id+'/jobs')}else{$null})
  workflowSha256=(Get-FileHash '.github/workflows/quality-pr.yml' -Algorithm SHA256).Hash.ToLowerInvariant()
  sourceStatus=@(git status --short -- src tests)
}
$result|ConvertTo-Json -Depth 20|Set-Content -LiteralPath (Join-Path $OutputFolder 'exact-ci-observation.json') -Encoding utf8
[ordered]@{candidateSha=$CandidateSha;runId=$run.id;runStatus=$run.status;runConclusion=$run.conclusion;checks=$checks.value.check_runs|Select-Object id,name,status,conclusion;annotations=$annotations.value|Select-Object annotation_level,message;jobsOk=$result.jobs.ok;jobs=$result.jobs.value.jobs|Select-Object id,name,conclusion,runner_name,steps;remoteRefs=$result.remoteRefs}|ConvertTo-Json -Depth 6

