param([Parameter(Mandatory=$true)][string]$ExpectedSha)
$ErrorActionPreference = 'Stop'
$taskRoot = (Get-Location).Path
$taskEvidence = Join-Path $taskRoot ('docs/quality/uiux-task-HN-S01-004/integration/' + $ExpectedSha.Substring(0,7))
New-Item -ItemType Directory -Path $taskEvidence -Force | Out-Null
$taskHead = (git rev-parse HEAD).Trim()
if ($taskHead -ne $ExpectedSha) { throw 'Candidate HEAD mismatch' }
if (git status --porcelain -- src) { throw 'Source must be clean before candidate verification' }
$taskStart = [DateTime]::UtcNow.ToString('o')
& npm.cmd run quality:pr *> (Join-Path $taskEvidence 'quality-pr.log')
$taskExit = $LASTEXITCODE
$taskFiles = foreach ($taskEntry in Get-ChildItem -LiteralPath (Join-Path $taskRoot 'dist') -File -Recurse) {
  [ordered]@{path=[IO.Path]::GetRelativePath($taskRoot,$taskEntry.FullName);bytes=$taskEntry.Length;sha256=(Get-FileHash -LiteralPath $taskEntry.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
}
$taskProtected = Get-Content -LiteralPath (Join-Path $taskRoot 'docs/quality/uiux-task-HN-S01-004/PROTECTED_SOURCE_BEFORE.json') -Raw | ConvertFrom-Json
$taskMismatches = @($taskProtected | Where-Object { (Get-FileHash -LiteralPath (Join-Path $taskRoot $_.path) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $_.sha256 })
$taskResult = [ordered]@{
  command='npm.cmd run quality:pr';exitCode=$taskExit;startedUtc=$taskStart;endedUtc=[DateTime]::UtcNow.ToString('o');
  expectedSha=$ExpectedSha;headStart=$taskHead;headEnd=(git rev-parse HEAD).Trim();sourceTree=(git rev-parse HEAD:src).Trim();
  sourceStatus=@(git status --porcelain -- src);protectedCount=$taskProtected.Count;protectedMismatches=$taskMismatches;
  buildFiles=@($taskFiles);provenanceQualification='Local command/build-byte receipt only. Existing build-info writer copies historical SOURCE_PROVENANCE and does not attest deployed HEAD. No deployment performed.'
}
$taskResult | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $taskEvidence 'candidate-results.json') -Encoding utf8
[PSCustomObject]$taskResult | Select-Object command,exitCode,headStart,headEnd,sourceTree,protectedCount,@{n='mismatches';e={$_.protectedMismatches.Count}} | ConvertTo-Json -Depth 4
if ($taskResult.headEnd -ne $ExpectedSha -or $taskResult.sourceStatus.Count -or $taskMismatches.Count) { throw 'Candidate source/protection custody changed during verification' }
exit $taskExit
