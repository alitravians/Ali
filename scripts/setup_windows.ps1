# ============================================================================
# setup_windows.ps1 — one-time Windows toolchain for the donation-city Roblox
# publish pipeline (Blender FBX assets + Rust/MSVC rbxlx->rbxl converter +
# selene/luau linters).
#
# WHY THIS EXISTS: Devin snapshot builds run on Linux, so the Windows-only
# toolchain cannot be installed by the blueprint's `initialize` step (that fails
# with exit 127: `choco: command not found`). Instead, a fresh Windows session
# runs this idempotent script once:
#
#   powershell -ExecutionPolicy Bypass -File scripts\setup_windows.ps1
#
# Requires Chocolatey (choco) to be available on the Windows session.
# The script is idempotent and fail-fast: it aborts on the first failing step.
# ============================================================================
#Requires -RunAsAdministrator
$ErrorActionPreference = "Stop"

# $ErrorActionPreference only catches cmdlet errors, not non-zero exits from
# native executables (choco/rustup). Wrap native calls so a failure aborts.
function Invoke-Native {
	param([Parameter(Mandatory)][scriptblock]$Command, [string]$What = "command")
	& $Command
	if ($LASTEXITCODE -ne 0) { throw "$What failed with exit code $LASTEXITCODE" }
}

# Download+extract a pinned tool into C:\tools\bin only if that exact version
# isn't already installed — keeps re-runs idempotent (no needless re-download,
# and works offline once installed). A marker file records the installed version
# because some tools (e.g. luau-analyze) have no --version flag, mirroring the
# Linux setup (.agents/skills/analyzing-donation-city-luau/setup.sh).
function Install-PinnedTool {
	param(
		[Parameter(Mandatory)][string]$Exe,     # e.g. selene.exe
		[Parameter(Mandatory)][string]$Version,  # exact pinned version, recorded in the marker
		[Parameter(Mandatory)][string]$Url
	)
	$exePath = Join-Path "C:\tools\bin" $Exe
	$marker  = Join-Path "C:\tools\bin" (".{0}.version" -f $Exe)
	if ((Test-Path $exePath) -and (Test-Path $marker) -and ((Get-Content $marker -Raw).Trim() -eq $Version)) { return }
	$zip = Join-Path "C:\tools\bin" "_dl.zip"
	# -UseBasicParsing avoids the IE-engine dependency on fresh Windows Server / PowerShell 5.1.
	Invoke-WebRequest $Url -OutFile $zip -UseBasicParsing
	Expand-Archive $zip -Force -DestinationPath C:\tools\bin
	Remove-Item $zip -ErrorAction SilentlyContinue
	Set-Content -Path $marker -Value $Version -NoNewline
}

# Refresh the current session's PATH/env from the machine registry so tools
# installed by a preceding `choco install` are visible to later commands here.
function Update-Env {
	$chocoProfile = "$env:ChocolateyInstall\helpers\chocolateyProfile.psm1"
	if (Test-Path $chocoProfile) {
		Import-Module $chocoProfile -ErrorAction SilentlyContinue
		if (Get-Command Update-SessionEnvironment -ErrorAction SilentlyContinue) { Update-SessionEnvironment }
	}
}

# Blender (map-design policy: all new visuals are Blender FBX assets)
Invoke-Native { choco install blender -y --no-progress } "choco install blender"

# Rust via rustup with the MSVC toolchain (publish.py calls `cargo +stable build`)
Invoke-Native { choco install rustup.install -y --no-progress } "choco install rustup.install"
# rustup was just installed — refresh PATH so `rustup` resolves in this session.
Update-Env
Invoke-Native { rustup toolchain install stable-x86_64-pc-windows-msvc } "rustup toolchain install"
Invoke-Native { rustup default stable-x86_64-pc-windows-msvc } "rustup default"

# MSVC C++ build tools — required to LINK the rbxlx->rbxl Rust converter
Invoke-Native { choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --quiet --norestart" -y --no-progress } "choco install vs buildtools"

# selene (Luau linter) + luau-analyze into C:\tools\bin.
# Both are pinned for reproducible lint results: selene must match donation-city/selene.toml,
# and luau must match the Linux setup (.agents/skills/analyzing-donation-city-luau/setup.sh).
New-Item -ItemType Directory -Force -Path C:\tools\bin | Out-Null
Install-PinnedTool "selene.exe" "0.31.0" "https://github.com/Kampfkarren/selene/releases/download/0.31.0/selene-0.31.0-windows.zip"
Install-PinnedTool "luau-analyze.exe" "0.725" "https://github.com/luau-lang/luau/releases/download/0.725/luau-windows.zip"

# Resolve the installed Blender dir dynamically (version number varies by choco build).
$blender = (Get-ChildItem "C:\Program Files\Blender Foundation\Blender*" -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1).FullName

# Persist PATH idempotently — only append dirs not already present (avoids PATH bloat on re-runs).
$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
foreach ($dir in @($blender, "C:\tools\bin")) {
	if ($dir -and (($machinePath -split ";") -notcontains $dir)) { $machinePath += ";$dir" }
}
[Environment]::SetEnvironmentVariable("Path", $machinePath, "Machine")

# Persist the MSVC linker (works around Git's link.exe shadowing MSVC link.exe).
# Pick the highest MSVC toolset version if several are installed.
$msvcLink = (Get-ChildItem "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\*\bin\Hostx64\x64\link.exe" -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1).FullName
if ($msvcLink) { [Environment]::SetEnvironmentVariable("CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER", $msvcLink, "Machine") }

Write-Output "setup_windows.ps1: done. Restart the shell so machine PATH/env changes take effect."
