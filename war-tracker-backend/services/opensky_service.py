"""OpenSky Network integration for real-time aircraft tracking."""
import httpx
from datetime import datetime, timezone
from models import AircraftPosition
from config import OPENSKY_BASE_URL, REGION_BBOX


async def fetch_aircraft_positions() -> list[AircraftPosition]:
    """Fetch live aircraft positions over the Middle East region."""
    positions: list[AircraftPosition] = []

    url = f"{OPENSKY_BASE_URL}/states/all"
    params = {
        "lamin": str(REGION_BBOX["min_lat"]),
        "lamax": str(REGION_BBOX["max_lat"]),
        "lomin": str(REGION_BBOX["min_lng"]),
        "lomax": str(REGION_BBOX["max_lng"]),
    }

    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            resp = await client.get(url, params=params)

            if resp.status_code == 429:
                print("[OpenSky] Rate limited, skipping this cycle")
                return []

            if resp.status_code >= 400:
                print(f"[OpenSky] HTTP {resp.status_code}, skipping")
                return []

            text = resp.text.strip()
            if not text or text.startswith('<'):
                print("[OpenSky] Got non-JSON response, skipping")
                return []

            data = resp.json()

        states = data.get("states", []) or []
        now = datetime.now(timezone.utc)

        for state in states:
            if len(state) < 8:
                continue

            icao24 = state[0] or ""
            callsign = (state[1] or "").strip()
            lng = state[5]
            lat = state[6]
            altitude = state[7]
            velocity = state[9] if len(state) > 9 else None
            heading = state[10] if len(state) > 10 else None
            on_ground = state[8] if len(state) > 8 else False

            if lat is None or lng is None:
                continue

            positions.append(AircraftPosition(
                icao24=icao24,
                callsign=callsign if callsign else None,
                lat=lat,
                lng=lng,
                altitude=altitude,
                velocity=velocity,
                heading=heading,
                on_ground=bool(on_ground),
                timestamp=now,
            ))

        if positions:
            print(f"[OpenSky] Tracking {len(positions)} aircraft")

    except httpx.TimeoutException:
        print("[OpenSky] Request timed out, skipping")
    except httpx.HTTPError as e:
        print(f"[OpenSky] HTTP error: {e}")
    except Exception as e:
        print(f"[OpenSky] Error: {e}")

    return positions
