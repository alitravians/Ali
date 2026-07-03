#!/usr/bin/env python3
"""
Automated publish pipeline for مدينة شهد (Donation City).

Steps:
  1. Lint all Luau source files (selene + luau-analyze)
  2. Build: inject latest source into DonationCity_FINAL.rbxlx
  3. Normalize legacy ContentId props into Studio-compatible XML
  4. Convert normalized rbxlx to canonical binary rbxl
  5. Upload the binary rbxl to Roblox Open Cloud API

Requires:
  - Environment variable ROBLOX_PUBLISH_API_KEY
  - selene (Luau linter) on PATH
  - luau-analyze on PATH (optional, skipped if missing)
  - Rust toolchain / cargo for the rbxlx -> rbxl converter

Usage:
  python3 publish.py              # lint + build + convert + publish
  python3 publish.py --lint-only  # lint only, no build/publish
  python3 publish.py --skip-lint  # build + convert + publish without linting
"""

import json
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

# --- Configuration ---
UNIVERSE_ID = "10237943037"
PLACE_ID = "134706113896132"
RBXLX_FILE = Path("DonationCity_FINAL.rbxlx")
SRC_DIR = Path("src")
BUILD_DIR = Path("build")
NORMALIZED_RBXLX = BUILD_DIR / "normalized.rbxlx"
BINARY_RBXL = BUILD_DIR / "DonationCity_FINAL.rbxl"
NORMALIZER = Path("tools") / "normalize_rbxlx.py"
CONVERTER_DIR = Path("tools") / "rbxlx2rbxl"
CONVERTER_MANIFEST = CONVERTER_DIR / "Cargo.toml"
CONVERTER_BINARY = CONVERTER_DIR / "target" / "release" / "rbxlx2rbxl"
API_URL = f"https://apis.roblox.com/universes/v1/{UNIVERSE_ID}/places/{PLACE_ID}/versions?versionType=Published"


def run(cmd, capture=True):
    """Run a command and return (returncode, stdout, stderr)."""
    result = subprocess.run(cmd, capture_output=capture, text=True)
    return result.returncode, result.stdout, result.stderr


def extract_dropped_properties(output: str):
    """Extract the dropped property list from the converter output."""
    dropped = []
    capture = False
    for line in output.splitlines():
        if line.startswith("dropped properties:"):
            capture = True
            continue
        if capture:
            if line.startswith("  "):
                dropped.append(line.strip())
                continue
            if line.strip():
                break
    return dropped


def lint():
    """Run selene + luau-analyze on all Luau source files."""
    print("\n=== STEP 1: Linting Luau sources ===")

    lua_files = sorted(
        str(SRC_DIR / f)
        for f in os.listdir(SRC_DIR)
        if f.endswith(".lua")
    )
    if not lua_files:
        sys.exit("ERROR: No .lua files found in src/")

    print(f"Found {len(lua_files)} Lua files")

    # --- selene ---
    errors = 0
    selene_path = subprocess.run(
        ["which", "selene"], capture_output=True, text=True
    ).stdout.strip()

    if selene_path:
        print(f"\nRunning selene ({selene_path})...")
        code, out, err = run(["selene", "--display-style=quiet"] + lua_files)
        # Only count actual errors (not warnings) as blocking
        lines = (out + err).strip().split("\n") if (out + err).strip() else []
        actual_errors = [l for l in lines if ": error[" in l]
        warnings = [l for l in lines if ": warning[" in l]
        if actual_errors:
            print(f"  selene: {len(actual_errors)} ERROR(s):")
            for l in actual_errors:
                print(f"    {l}")
            errors += len(actual_errors)
        else:
            print(f"  selene: 0 errors, {len(warnings)} warnings (non-blocking)")
    else:
        print("WARNING: selene not found on PATH, skipping")

    # --- luau-analyze ---
    luau_path = subprocess.run(
        ["which", "luau-analyze"], capture_output=True, text=True
    ).stdout.strip()

    if luau_path:
        print(f"\nRunning luau-analyze ({luau_path})...")
        code, out, err = run(["luau-analyze"] + lua_files)
        lines = (out + err).strip().split("\n") if (out + err).strip() else []
        # Only count TypeError/SyntaxError as blocking; skip Roblox-specific noise
        actual_errors = [
            l for l in lines
            if l.strip()
            and ": Error" in l
            and "Unknown global" not in l
            and "Unknown type" not in l
            and "is not a valid member" not in l
        ]
        warnings = [l for l in lines if l.strip() and ": Warning" in l]
        if actual_errors:
            print(f"  luau-analyze: {len(actual_errors)} ERROR(s):")
            for l in actual_errors[:20]:
                print(f"    {l}")
            errors += len(actual_errors)
        else:
            print(f"  luau-analyze: 0 errors, {len(warnings)} warnings (non-blocking)")
    else:
        print("WARNING: luau-analyze not found on PATH, skipping")

    if errors > 0:
        print(f"\nLINT FAILED: {errors} error(s) found. Fix them before publishing.")
        sys.exit(1)

    print("\nLint passed! All files are clean.")
    return True


def build():
    """Run build_all.py to inject sources into rbxlx."""
    print("\n=== STEP 2: Building (injecting sources) ===")
    code, out, err = run([sys.executable, "build_all.py"])
    if code != 0:
        print(f"BUILD FAILED:\n{out}\n{err}")
        sys.exit(1)
    print(out.strip())
    print("Build complete.")


def normalize_content_id_props():
    """Normalize legacy ContentId properties into Studio-compatible XML."""
    print("\n=== STEP 3: Normalizing legacy ContentId props ===")
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    if not NORMALIZER.exists():
        sys.exit(f"ERROR: normalizer not found: {NORMALIZER}")

    code, out, err = run([
        sys.executable,
        str(NORMALIZER),
        str(RBXLX_FILE),
        str(NORMALIZED_RBXLX),
    ])
    if code != 0:
        print(f"NORMALIZATION FAILED:\n{out}\n{err}")
        sys.exit(1)

    if out.strip():
        print(out.strip())
    if err.strip():
        print(err.strip())

    if not NORMALIZED_RBXLX.exists() or NORMALIZED_RBXLX.stat().st_size == 0:
        sys.exit("ERROR: normalized rbxlx output is missing or empty")

    print(f"  wrote {NORMALIZED_RBXLX} ({NORMALIZED_RBXLX.stat().st_size:,} bytes)")


def build_converter():
    """Build the Rust converter if needed."""
    if CONVERTER_BINARY.exists():
        return

    print("\n=== STEP 4: Building rbxlx -> rbxl converter (cargo) ===")
    cargo = shutil.which("cargo")
    if not cargo:
        sys.exit("ERROR: cargo not found on PATH. Install the Rust toolchain first.")

    code, out, err = run([
        cargo,
        "+stable",
        "build",
        "--release",
        "--manifest-path",
        str(CONVERTER_MANIFEST),
    ])
    if code != 0:
        print(f"CONVERTER BUILD FAILED:\n{out}\n{err}")
        sys.exit(1)

    if out.strip():
        print(out.strip())
    if err.strip():
        print(err.strip())

    if not CONVERTER_BINARY.exists():
        sys.exit(f"ERROR: converter binary missing after build: {CONVERTER_BINARY}")


def convert_to_binary():
    """Convert the normalized rbxlx to a canonical binary rbxl."""
    print("\n=== STEP 4: Converting normalized rbxlx to binary rbxl ===")
    build_converter()

    combined_output = ""
    code, out, err = run([
        str(CONVERTER_BINARY),
        str(NORMALIZED_RBXLX),
        str(BINARY_RBXL),
    ])
    if out.strip():
        print(out.strip())
    if err.strip():
        print(err.strip())

    combined_output = "\n".join(part for part in (out, err) if part)

    dropped = extract_dropped_properties(combined_output)
    if dropped:
        dropped_block = "\n".join(f"  - {item}" for item in dropped)
        sys.exit(
            "ERROR: rbxl converter dropped property(s); refusing to publish.\n"
            f"{dropped_block}"
        )
    if code != 0:
        print(f"CONVERSION FAILED:\n{out}\n{err}")
        sys.exit(1)

    if not BINARY_RBXL.exists() or BINARY_RBXL.stat().st_size == 0:
        sys.exit("ERROR: binary rbxl output is missing or empty")

    print(f"  wrote {BINARY_RBXL} ({BINARY_RBXL.stat().st_size:,} bytes)")


def publish():
    """Upload binary rbxl to Roblox Open Cloud API."""
    if os.environ.get("DONATION_CITY_SKIP_UPLOAD") == "1":
        print("\n=== STEP 5: Upload skipped (DONATION_CITY_SKIP_UPLOAD=1) ===")
        return None

    print("\n=== STEP 5: Publishing to Roblox ===")

    api_key = os.environ.get("ROBLOX_PUBLISH_API_KEY")
    if not api_key:
        sys.exit("ERROR: ROBLOX_PUBLISH_API_KEY environment variable not set")

    file_size = BINARY_RBXL.stat().st_size
    print(f"  Uploading {BINARY_RBXL} ({file_size:,} bytes)...")
    print(f"  Universe: {UNIVERSE_ID} | Place: {PLACE_ID}")

    data = BINARY_RBXL.read_bytes()

    req = urllib.request.Request(
        API_URL,
        data=data,
        method="POST",
        headers={
            "x-api-key": api_key,
            "Content-Type": "application/octet-stream",
            "Content-Length": str(len(data)),
        },
    )

    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode())
            version = body.get("versionNumber", "?")
            print(f"\n  Published successfully! Version: {version}")
            return version
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"\n  PUBLISH FAILED (HTTP {e.code}): {error_body}")
        sys.exit(1)


def main():
    os.chdir(Path(__file__).resolve().parent)

    skip_lint = "--skip-lint" in sys.argv
    lint_only = "--lint-only" in sys.argv

    if not skip_lint:
        lint()

    if lint_only:
        print("\n--lint-only: stopping after lint.")
        return

    build()
    normalize_content_id_props()
    convert_to_binary()
    publish()

    print("\n=== Pipeline complete! ===")


if __name__ == "__main__":
    main()
