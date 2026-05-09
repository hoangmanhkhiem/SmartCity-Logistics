#Requires -Version 5.1
<#
  Import research INSERT scripts into Postgres after Prisma migration applied.
  Prerequisites: Docker Postgres running (docker compose up -d), DATABASE_URL in .env.

  Usage (from urban-logistics-backend):
    .\scripts\import-research-sql.ps1
    .\scripts\import-research-sql.ps1 -RepoRoot "D:\LOG\SmartCity-Logistics"

  Dry run (list files, do not call psql):
    .\scripts\import-research-sql.ps1 -DryRun
#>
param(
    [string] $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
    [switch] $DryRun
)

$ErrorActionPreference = "Stop"

$sqlFiles = @(
    "_0_Bang_Thu_Thap__202604041857.sql",
    "_1_khu_thu_thap_cau_giay__202604041858.sql",
    "_2_khu_thu_thap_dong_da__202604041858.sql",
    "_3_khu_thu_thap_hoan_kiem__202604041858.sql",
    "_4_khu_thu_thap_cua_nam__202604041858.sql",
    "_5_khu_cong_nghiep_ba_dinh__202604041858.sql",
    "_6_khu_thu_thap_giang_vo__202604041858.sql",
    "b_202604041858.sql",
    "grab_202604041859.sql",
    "shopee_202604041859.sql"
)

if (-not $DryRun) {
    $psql = Get-Command psql -ErrorAction SilentlyContinue
    if (-not $psql) {
        Write-Error "psql not found. Install PostgreSQL client tools or use: docker exec -i urban-logistics-db psql -U postgres -d urban_logistics -f /path/to/file.sql"
    }
}

Write-Host "Repo root: $RepoRoot"

if (-not $DryRun) {
    $envFile = Join-Path $PSScriptRoot "..\.env"
    if (-not (Test-Path $envFile)) {
        Write-Error ".env not found at $envFile"
    }
    $databaseUrl = (Get-Content $envFile | Where-Object { $_ -match '^\s*DATABASE_URL=' } | Select-Object -First 1) -replace '^\s*DATABASE_URL=', '' -replace '^"|"$', ''
    if (-not $databaseUrl) {
        Write-Error "DATABASE_URL missing in .env"
    }
    if ($databaseUrl -notmatch '^postgresql://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/([^?]+)') {
        Write-Error "Could not parse DATABASE_URL (expected postgresql://user:pass@host:port/db)"
    }
    $user = $Matches[1]
    $pass = $Matches[2]
    $hostName = $Matches[3]
    $port = if ($Matches[4]) { $Matches[4] } else { "5432" }
    $db = $Matches[5]
    $env:PGPASSWORD = $pass
    Write-Host "Target: ${user}@${hostName}:${port}/${db}"
}
if ($DryRun) {
    Write-Host "Mode: dry run"
}

foreach ($name in $sqlFiles) {
    $path = Join-Path $RepoRoot $name
    if (-not (Test-Path $path)) {
        Write-Error "Missing file: $path"
    }
    Write-Host "Running: $name"
    if ($DryRun) { continue }
    & psql -v ON_ERROR_STOP=1 -h $hostName -p $port -U $user -d $db -f $path
    if ($LASTEXITCODE -ne 0) {
        Write-Error "psql failed on $name (exit $LASTEXITCODE)"
    }
}

Write-Host "Done."
