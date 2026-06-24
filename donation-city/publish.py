#!/usr/bin/env python3
"""
Automated publish pipeline for مدينة شهد (Donation City).

Steps:
  1. Lint all Luau source files (selene + luau-analyze)
  2. Build: inject latest source into DonationCity_FINAL.rbxlx
  3. Validate XML structure
  4. Strip XML declaration if present (Roblox API rejects it)
  5. Upload to Roblox Open Cloud API

Requires:
  - Environment variable ROBLOX_PUBLISH_API_KEY
  - selene (Luau linter) on PATH
  - luau-analyze on PATH (optional, skipped if missing)

Usage:
  python3 publish.py              # lint + build + publish
  python3 publish.py --lint-only  # lint only, no publish
  python3 publish.py --skip-lint  # build + publish without linting
"""
import os
import sys
import subprocess
import xml.etree.ElementTree as ET
import urllib.request
import json

# --- Configuration ---
UNIVERSE_ID = "10237943037"
PLACE_ID = "134706113896132"
RBXLX_FILE = "DonationCity_FINAL.rbxlx"
SRC_DIR = "src"
API_URL = f"https://apis.roblox.com/universes/v1/{UNIVERSE_ID}/places/{PLACE_ID}/versions?versionType=Published"


def run(cmd, capture=True):
    """Run a shell command and return (returncode, stdout)."""
    result = subprocess.run(cmd, capture_output=capture, text=True)
    return result.returncode, result.stdout, result.stderr


def lint():
    """Run selene + luau-analyze on all Luau source files."""
    print("\n=== STEP 1: Linting Luau sources ===")

    lua_files = sorted(
        os.path.join(SRC_DIR, f)
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
            and ": Error" in l  # luau-analyze uses "Error" for real errors
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


def validate_xml():
    """Validate the rbxlx file is well-formed XML."""
    print("\n=== STEP 3: Validating XML ===")
    try:
        ET.parse(RBXLX_FILE)
        print(f"  {RBXLX_FILE} is valid XML")
    except ET.ParseError as e:
        print(f"XML VALIDATION FAILED: {e}")
        sys.exit(1)


def strip_xml_declaration():
    """Remove <?xml ...?> declaration if present (Roblox API rejects it)."""
    print("\n=== STEP 4: Stripping XML declaration ===")
    with open(RBXLX_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    if content.startswith("<?xml"):
        # Remove first line (XML declaration)
        newline_idx = content.index("\n")
        content = content[newline_idx + 1:]
        with open(RBXLX_FILE, "w", encoding="utf-8") as f:
            f.write(content)
        print("  Removed XML declaration")
    else:
        print("  No XML declaration found (already clean)")


def publish():
    """Upload rbxlx to Roblox Open Cloud API."""
    print("\n=== STEP 5: Publishing to Roblox ===")

    api_key = os.environ.get("ROBLOX_PUBLISH_API_KEY")
    if not api_key:
        sys.exit("ERROR: ROBLOX_PUBLISH_API_KEY environment variable not set")

    file_size = os.path.getsize(RBXLX_FILE)
    print(f"  Uploading {RBXLX_FILE} ({file_size:,} bytes)...")
    print(f"  Universe: {UNIVERSE_ID} | Place: {PLACE_ID}")

    with open(RBXLX_FILE, "rb") as f:
        data = f.read()

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
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    skip_lint = "--skip-lint" in sys.argv
    lint_only = "--lint-only" in sys.argv

    # Step 1: Lint
    if not skip_lint:
        lint()

    if lint_only:
        print("\n--lint-only: stopping after lint.")
        return

    # Step 2: Build
    build()

    # Step 3: Validate XML
    validate_xml()

    # Step 4: Strip XML declaration
    strip_xml_declaration()

    # Step 5: Publish
    publish()

    print("\n=== Pipeline complete! ===")


if __name__ == "__main__":
    main()
