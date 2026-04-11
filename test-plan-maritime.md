# Maritime Vessel Tracking — Test Plan

## What Changed
Live AIS vessel tracking added to WarScope. Real ship positions from AISStream.io now appear on the map as 3D rotating markers. A maritime monitoring panel below the map shows zone statistics for Strait of Hormuz, Red Sea, and Suez Canal.

## Code Evidence
- **Navigation**: Sidebar link "التتبع المباشر" → `/live` route (LiveTracking.tsx)
- **Maritime panel**: LiveTracking.tsx lines 159-163 renders `<MaritimePanel />` below map grid
- **Vessel markers**: LiveMap.tsx lines 235-251 — `MapEvents` checks `activeLayers.includes('maritime')` to render `<VesselMarker>` components
- **Default active**: LiveMap.tsx line 255 initializes `activeLayers` with ALL `mapLayers` IDs; 'maritime' is at staticConfig.ts line 14
- **Data path**: LiveDataContext.tsx lines 93-98 sets `vessels` and `maritimeZones` from WebSocket `initial_data`; lines 101-108 handle `maritime_update` messages
- **Backend**: `/api/vessels` endpoint returns `{vessels: [...], zones: [...]}` — currently has 2 real vessels in Hormuz zone

---

## Test 1: Verify real vessel markers appear on the map

**Steps:**
1. Navigate to `https://dist-danynpxi.devinapps.com/live`
2. Wait 10 seconds for WebSocket to connect and deliver vessel data
3. Zoom into the Strait of Hormuz area (Persian Gulf, around lat 25-26, lng 54-56) using scroll wheel or zoom controls

**Pass criteria:**
- At least 1 vessel marker (colored SVG ship icon) is visible on the map in the Hormuz area
- The marker is NOT a standard Leaflet blue pin — it should be a colored polygon/ship shape (confirms 3D vessel SVG rendering, not fallback)
- If the marker is broken (missing icon), Leaflet would show a broken image placeholder or nothing at all

**Fail criteria:**
- No markers visible in the Hormuz area after zooming in
- Standard blue Leaflet pin markers instead of colored ship SVGs
- Console errors related to vessel rendering

---

## Test 2: Verify vessel popup shows real ship data

**Steps:**
1. Click on a vessel marker in the Hormuz zone
2. Inspect the popup content

**Pass criteria:**
- Popup appears with a dark semi-transparent background (vessel-custom-popup CSS)
- Popup contains a vessel name (e.g., "MOONLIGHT II" or "VALLIANZ STEADFAST" — real ship names, NOT "VESSEL-XXXX")
- Popup shows Arabic ship type badge (e.g., "شحن" for cargo)
- Popup shows speed value with "عقدة" unit
- Popup shows MMSI number at the bottom
- Popup shows zone name "مضيق هرمز"

**Fail criteria:**
- Popup doesn't open
- Popup shows "VESSEL-XXXX" placeholder instead of real name
- Popup missing speed/type/zone fields
- Popup uses default Leaflet white styling instead of dark theme

---

## Test 3: Verify maritime monitoring panel with zone statistics

**Steps:**
1. Scroll down below the map on the /live page
2. Look for the "البث المباشر البحري" (Maritime Live Broadcast) panel

**Pass criteria:**
- Panel header shows ship icon + "البث المباشر البحري" title
- Green "AIS مباشر" badge with pulsing dot is visible (confirms live status indicator)
- Total vessel count badge shows "N سفينة" where N ≥ 1
- Three zone cards visible: "مضيق هرمز", "البحر الأحمر (باب المندب)", "قناة السويس"
- Hormuz zone card shows vessel count ≥ 1 (matching backend data)
- A vessel list section "السفن المرصودة" shows at least one vessel row with name, type, and speed

**Fail criteria:**
- Panel shows "جاري الاتصال بنظام AIS..." (connecting message) — means no data received
- All zone counts show 0
- Panel is completely missing from the page
- No "AIS مباشر" badge visible

---

## Test 4: Verify map legend includes vessel category

**Steps:**
1. Look at the map legend overlay (bottom-left or bottom area of the map)

**Pass criteria:**
- Legend contains a ship icon (⛵ or Ship icon from lucide) with Arabic text "سفن"
- This is in addition to existing legend items (ضربات, إنذارات, رسمي, إنساني)

**Fail criteria:**
- No "سفن" entry in the legend
- Legend is unchanged from before (only 4 items, missing vessels)
