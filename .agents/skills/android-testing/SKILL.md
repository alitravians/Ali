# Android App Testing on Appetize.io

## Overview
Workflow for testing Android APKs on Appetize.io online emulator when local KVM is unavailable.

## Build APK
```bash
cd arabizi-keyboard && ./gradlew assembleDebug
# APK output: app/build/outputs/apk/debug/app-debug.apk
```

## Upload to Appetize.io
1. Navigate to https://appetize.io/apps?upload=true
2. If app already exists, click on it → "Upload New Build"
3. Use Playwright CDP (`http://localhost:29229`) for file upload via `expect_file_chooser()`
4. Wait 15-20 seconds for upload to complete

## Emulator Configuration
- **Device**: Pixel 7
- **OS**: Android 13.0
- **Enable**: Debug Logs + Network Logs (under Show Developer Tools)
- **Session limit**: ~3 minutes on free tier — plan tests efficiently

## Testing Checklist
1. Launch app and navigate through all screens
2. Enable ALL settings toggles to verify they work
3. Monitor Debug Logs tab for crash stack traces
4. Monitor Network Logs tab for HTTP errors (user emphasized this is critical)
5. Test all interactive elements (buttons, toggles, text inputs)

## IME Keyboard Testing Limitation
Appetize.io cannot test custom keyboards (IME) because:
- The keyboard must be activated as the system IME via Android Settings → Keyboard → Enable/Select
- Appetize.io session limits and system restrictions make this impractical
- Full IME testing requires a physical device or local ADB-capable emulator

## Playwright Upload Script Pattern
```python
import asyncio
from playwright.async_api import async_playwright

async def upload_apk():
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp("http://localhost:29229")
        # Find the appetize.io app page
        page = None
        for ctx in browser.contexts:
            for pg in ctx.pages:
                if "appetize.io/apps" in pg.url:
                    page = pg
                    break
        # Click Upload New Build, then handle file chooser
        await page.locator("button:has-text('Upload New Build')").click()
        async with page.expect_file_chooser() as fc_info:
            await page.locator("button:has-text('Select A File')").click()
        fc = await fc_info.value
        await fc.set_files("/path/to/app-debug.apk")
        await asyncio.sleep(20)  # Wait for upload

asyncio.run(upload_apk())
```
