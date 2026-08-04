<#
.SYNOPSIS
  Scans open GitHub issues mentioning "@IA", delegates each to the opencode
  github-issue-agent, and labels them as processed.
.DESCRIPTION
  Intended to be run periodically (e.g. every 10 minutes via Task Scheduler).
  Requires:
    - gh CLI (https://cli.github.com) authenticated to the repo's remote
    - opencode CLI installed and on PATH
    - GITHUB_TOKEN environment variable or gh auth login completed
.PARAMETER Repo
  GitHub repo in "owner/repo" format (default: auto-detected from git remote).
.PARAMETER Label
  Label applied after processing (default: "ia-processed").
.EXAMPLE
  .\scripts\ia-issue-bot.ps1
  .\scripts\ia-issue-bot.ps1 -Repo "Ryze05/world-cup-2022"
#>

param(
  [string]$Repo = "",
  [string]$Label = "ia-processed"
)

$ErrorActionPreference = "Continue"

# ---- 1. Detect repository from git remote if not provided ----
if (-not $Repo) {
  $remote = & git config --get remote.origin.url 2>$null
  if (-not $remote) { Write-Error "No git remote found and -Repo not provided"; exit 1 }
  # handle both git@github.com:owner/repo.git and https://github.com/owner/repo.git
  if ($remote -match '(?:github\.com[:\/])([^\/]+)\/(.+?)\.git$') {
    $Repo = "$($matches[1])/$($matches[2])"
  } else {
    Write-Error "Could not parse remote URL: $remote"; exit 1
  }
}

Write-Host "[IA Bot] Repo: $Repo"

# ---- 2. Find unprocessed issues mentioning @IA ----
$issuesRaw = gh issue list --repo $Repo --state open --json number,title,body,labels 2>$null
if (-not $issuesRaw) {
  Write-Host "[IA Bot] No issues found."
  exit 0
}

$allIssues = $issuesRaw | ConvertFrom-Json
$issues = $allIssues | Where-Object {
  $titleHasIA = $_.title -and $_.title -match '@IA'
  $bodyHasIA  = $_.body  -and $_.body  -match '@IA'
  $alreadyProcessed = $_.labels -and $_.labels.name -and ($_.labels.name -contains $Label)
  ($titleHasIA -or $bodyHasIA) -and -not $alreadyProcessed
}

if (-not $issues) {
  Write-Host "[IA Bot] No unprocessed @IA issues found."
  exit 0
}

$issues | ForEach-Object {
  $num   = $_.number
  $title = $_.title
  Write-Host "[IA Bot] Processing #$num - $title"

  # ---- 3. Run opencode agent ----
  $prompt = "Process GitHub issue #$($num): $title"
  $output = & opencode run --agent github-issue-agent --auto $prompt 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "[IA Bot] opencode exited with code $LASTEXITCODE for #$num"
    return  # continue to next issue
  }

  # ---- 4. Verify the agent labelled it (optional safety net) ----
  $issueLabels = gh issue view $num --repo $Repo --json labels 2>$null
  $hasLabel = $false
  if ($issueLabels) {
    $parsed = $issueLabels | ConvertFrom-Json
    if ($parsed.labels -and $parsed.labels.name) {
      $hasLabel = $parsed.labels.name -contains $Label
    }
  }
  if (-not $hasLabel) {
    Write-Host "[IA Bot] Adding label '$Label' to #$num"
    gh issue edit $num --repo $Repo --add-label $Label 2>$null
  }

  Write-Host "[IA Bot] Finished #$num"
}

Write-Host "[IA Bot] Done."
