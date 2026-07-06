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
# ============================================================================
$ErrorActionPreference = "Stop"

# Blender (map-design policy: all new visuals are Blender FBX assets)
choco install blender -y --no-progress

# Rust via rustup with the MSVC toolchain (publish.py calls `cargo +stable build`)
choco install rustup.install -y --no-progress
rustup toolchain install stable-x86_64-pc-windows-msvc
rustup default stable-x86_64-pc-windows-msvc

# MSVC C++ build tools — required to LINK the rbxlx->rbxl Rust converter
choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --quiet --norestart" -y --no-progress

# selene (Luau linter) + luau-analyze into C:\tools\bin
New-Item -ItemType Directory -Force -Path C:\tools\bin | Out-Null
Invoke-WebRequest "https://github.com/Kampfkarren/selene/releases/download/0.31.0/selene-0.31.0-windows.zip" -OutFile C:\tools\bin\selene.zip
Expand-Archive C:\tools\bin\selene.zip -Force -DestinationPath C:\tools\bin
Invoke-WebRequest "https://github.com/luau-lang/luau/releases/latest/download/luau-windows.zip" -OutFile C:\tools\bin\luau.zip
Expand-Archive C:\tools\bin\luau.zip -Force -DestinationPath C:\tools\bin
Remove-Item C:\tools\bin\*.zip -ErrorAction SilentlyContinue

# Persist PATH + the MSVC linker (works around Git's link.exe shadowing MSVC link.exe)
$blender = "C:\Program Files\Blender Foundation\Blender 5.1"
[Environment]::SetEnvironmentVariable("Path", ([Environment]::GetEnvironmentVariable("Path","Machine") + ";$blender;C:\tools\bin"), "Machine")
$msvcLink = (Get-ChildItem "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\*\bin\Hostx64\x64\link.exe" | Select-Object -First 1).FullName
if ($msvcLink) { [Environment]::SetEnvironmentVariable("CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER", $msvcLink, "Machine") }

Write-Output "setup_windows.ps1: done. Restart the shell so machine PATH/env changes take effect."
