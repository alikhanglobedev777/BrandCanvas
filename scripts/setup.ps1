$ErrorActionPreference = "Stop"

function Invoke-NativeCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Command,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code $LASTEXITCODE`: $Command $($Arguments -join ' ')"
  }
}

function Get-EnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  if (-not (Test-Path $Path)) {
    return $null
  }

  $line = Get-Content $Path | Where-Object { $_ -match "^$([regex]::Escape($Name))=" } | Select-Object -First 1
  if (-not $line) {
    return $null
  }

  return ($line -split "=", 2)[1].Trim()
}

function Set-EnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [Parameter(Mandatory = $true)]
    [string]$Name,

    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  $content = if (Test-Path $Path) { Get-Content $Path } else { @() }
  $pattern = "^$([regex]::Escape($Name))="
  $updated = $false

  $newContent = foreach ($line in $content) {
    if ($line -match $pattern) {
      "$Name=$Value"
      $updated = $true
    } else {
      $line
    }
  }

  if (-not $updated) {
    $newContent += "$Name=$Value"
  }

  Set-Content -Path $Path -Value $newContent -Encoding ascii
}

function Test-TcpPortInUse {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  return $null -ne (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1)
}

Write-Host "BrandCanvas initial setup" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed. Install Node.js 22.12 or newer first."
}

$nodeVersion = (node --version).TrimStart("v")
if ([version]$nodeVersion -lt [version]"22.12.0") {
  throw "Node.js $nodeVersion is unsupported. Install Node.js 22.12 or newer."
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Host "pnpm was not found. Installing pnpm 10 globally..." -ForegroundColor Yellow
  Invoke-NativeCommand npm install --global pnpm@10
}

$pnpmVersion = (pnpm --version).Trim()
if ([version]$pnpmVersion -lt [version]"10.0.0") {
  Write-Host "Upgrading pnpm to version 10..." -ForegroundColor Yellow
  Invoke-NativeCommand npm install --global pnpm@10
  $pnpmVersion = (pnpm --version).Trim()
}
Write-Host "Using Node.js $nodeVersion and pnpm $pnpmVersion" -ForegroundColor Green

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker is not installed or is not available in PATH. Install and start Docker Desktop first."
}

Invoke-NativeCommand docker info

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example" -ForegroundColor Green
}

Write-Host "Cleaning up containers from the previous BrandCanvas setup attempt..." -ForegroundColor Cyan
Invoke-NativeCommand docker compose down --remove-orphans

$currentRedisPort = Get-EnvValue -Path ".env" -Name "REDIS_HOST_PORT"
$redisPort = if ($currentRedisPort -and $currentRedisPort -match "^\d+$") {
  [int]$currentRedisPort
} else {
  6381
}

if (Test-TcpPortInUse -Port $redisPort) {
  $availablePort = 6381..6390 | Where-Object { -not (Test-TcpPortInUse -Port $_) } | Select-Object -First 1
  if (-not $availablePort) {
    throw "Redis ports 6381 through 6390 are already occupied. Free one of these ports and run setup again."
  }
  $redisPort = $availablePort
}

Set-EnvValue -Path ".env" -Name "REDIS_HOST_PORT" -Value $redisPort.ToString()
Set-EnvValue -Path ".env" -Name "REDIS_URL" -Value "redis://localhost:$redisPort"
Write-Host "BrandCanvas Redis will use host port $redisPort" -ForegroundColor Green

Write-Host "Installing workspace dependencies..." -ForegroundColor Cyan
Invoke-NativeCommand pnpm install

Write-Host "Starting PostgreSQL and Redis..." -ForegroundColor Cyan
Invoke-NativeCommand docker compose up -d

Write-Host "Waiting for PostgreSQL and Redis health checks..." -ForegroundColor Cyan
$services = @("brandcanvas-postgres", "brandcanvas-redis")
foreach ($service in $services) {
  $ready = $false

  for ($attempt = 1; $attempt -le 30; $attempt++) {
    $inspectOutput = & docker inspect $service 2>$null
    if ($LASTEXITCODE -eq 0 -and $inspectOutput) {
      $inspection = $inspectOutput | ConvertFrom-Json
      $state = $inspection[0].State
      $status = $state.Status
      $healthStatus = if ($state.Health) { $state.Health.Status } else { $null }

      if ($healthStatus -eq "healthy" -or (-not $healthStatus -and $status -eq "running")) {
        $ready = $true
        break
      }

      if ($status -eq "exited" -or $status -eq "dead") {
        break
      }
    }

    Start-Sleep -Seconds 2
  }

  if (-not $ready) {
    Write-Host "Container logs for $service`:" -ForegroundColor Yellow
    & docker logs $service --tail 50
    throw "$service did not become ready."
  }

  Write-Host "$service is ready." -ForegroundColor Green
}

Write-Host "Generating the initial Drizzle migration..." -ForegroundColor Cyan
Invoke-NativeCommand pnpm db:generate

Write-Host "Applying database migrations..." -ForegroundColor Cyan
Invoke-NativeCommand pnpm db:migrate

Write-Host "Running TypeScript checks..." -ForegroundColor Cyan
Invoke-NativeCommand pnpm typecheck

Write-Host "Setup completed." -ForegroundColor Green
Write-Host "Run: pnpm dev" -ForegroundColor Green
