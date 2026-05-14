"""Welcome-card image renderer.

Generates a per-member welcome card as a PNG bytes object. Used by the
`onboarding` cog after a member completes their interview.

Layout (1100 x 360 px, cyber-dark background):
  ┌─────────────────────────────────────────────────────┐
  │  ⬢ avatar     مرحباً، {nickname}                     │
  │  ⬢ (round)    عضونا رقم {N} في alitravians           │
  │  ⬢            {tagline based on experience tier}     │
  └─────────────────────────────────────────────────────┘
  Accent: cyber-green #00FF88 vertical bar on the left
  Footer: "alitravians.community"  (centred, dim)

Arabic glyphs go through arabic_reshaper + python-bidi so they render with
proper joined forms in right-to-left order — without that step Pillow draws
each letter in its isolated form and left-to-right which is unreadable.

Mixed-script rendering:
  Arabic-only fonts (NotoNaskhArabic) ship empty glyphs for Latin
  characters, so a string like "في alitravians" renders the Latin word as
  tofu boxes. We work around Pillow's lack of automatic font fallback by
  splitting the visual-order string into Arabic / non-Arabic runs and
  drawing each run with its own font (Arabic font + Latin Sans). This is
  the same technique web browsers use under the hood (CSS @font-face
  fallback per Unicode range).
"""

from __future__ import annotations

import io
import logging
from typing import Iterable

import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFont

log = logging.getLogger("boon-bot.welcome_card")

# Cyber palette matching the alitravians client.
BG = (10, 18, 14, 255)
PANEL = (16, 28, 22, 255)
ACCENT = (0, 255, 136, 255)
TEXT_PRIMARY = (235, 245, 240, 255)
TEXT_SECONDARY = (140, 175, 155, 255)
TEXT_FAINT = (90, 110, 100, 255)

CARD_W = 1100
CARD_H = 360
AVATAR_SIZE = 220
LEFT_PAD = 60
ACCENT_BAR_W = 10

# Font candidates per script. Order = preference; first loadable file wins.
# All paths come from the `fonts-noto-core` Debian package shipped in our
# Dockerfile, with DejaVu as a last-ditch fallback if the image is ever
# rebuilt without Noto installed.
_ARABIC_FONT_REGULAR: Iterable[str] = (
    "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
)
_ARABIC_FONT_BOLD: Iterable[str] = (
    "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
)
_LATIN_FONT_REGULAR: Iterable[str] = (
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
)
_LATIN_FONT_BOLD: Iterable[str] = (
    "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
)


def _first_loadable(paths: Iterable[str], size: int) -> ImageFont.FreeTypeFont:
    # Materialise upfront so we can re-list paths in the warning if every
    # candidate failed. Otherwise a generator would already be exhausted by
    # the time we hit the log line, and the message would say "tried []".
    candidates = list(paths)
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    log.warning("no truetype font found in %s; using pillow default", candidates)
    return ImageFont.load_default()


def _load_fonts(size: int, bold: bool = False) -> dict[str, ImageFont.FreeTypeFont]:
    """Return a {script: ImageFont} pair sized to `size` (and `bold` if set)."""
    return {
        "arabic": _first_loadable(
            _ARABIC_FONT_BOLD if bold else _ARABIC_FONT_REGULAR, size
        ),
        "latin": _first_loadable(
            _LATIN_FONT_BOLD if bold else _LATIN_FONT_REGULAR, size
        ),
    }


# Unicode ranges that NotoNaskhArabic / NotoSansArabic can render. Anything
# outside these blocks is sent to the Latin font instead.
_ARABIC_RANGES = (
    (0x0600, 0x06FF),  # Arabic
    (0x0750, 0x077F),  # Arabic Supplement
    (0x08A0, 0x08FF),  # Arabic Extended-A
    (0xFB50, 0xFDFF),  # Arabic Presentation Forms-A (reshaper output)
    (0xFE70, 0xFEFF),  # Arabic Presentation Forms-B (reshaper output)
)


def _is_arabic_codepoint(cp: int) -> bool:
    return any(lo <= cp <= hi for lo, hi in _ARABIC_RANGES)


def _script_of(ch: str) -> str | None:
    """Return ``"arabic"``, ``"latin"`` or ``None`` (inherit) for ``ch``.

    Whitespace returns ``None`` so it sticks to whatever run it's adjacent
    to — that keeps the space *between two Arabic words* drawn in the
    Arabic font (matching its kerning width) instead of randomly switching
    to NotoSans's space-advance every word boundary.
    """
    if ch.isspace():
        return None
    if _is_arabic_codepoint(ord(ch)):
        return "arabic"
    return "latin"


def _runs(text: str) -> list[tuple[str, str]]:
    """Split a visual-order string into ``(run_text, script)`` segments.

    The input has already been through ``arabic_reshaper`` + ``bidi`` so
    Arabic chars are in their presentation forms and the whole string reads
    left-to-right when blitted by Pillow. We just need to switch fonts at
    each script boundary; whitespace inherits the surrounding script.
    """
    if not text:
        return []
    out: list[tuple[str, str]] = []
    buf: list[str] = []
    current: str | None = None
    for ch in text:
        s = _script_of(ch)
        if s is None:
            # Whitespace — keep with current run; if we don't have one yet,
            # buffer until we discover the next real script.
            buf.append(ch)
            continue
        if current is None:
            current = s
            buf.append(ch)
        elif s == current:
            buf.append(ch)
        else:
            out.append(("".join(buf), current))
            buf = [ch]
            current = s
    if buf:
        # Pure-whitespace tail (or pure-whitespace string) defaults to latin
        # so the Latin font's space-width is used — visually identical.
        out.append(("".join(buf), current or "latin"))
    return out


def _ar(text: str) -> str:
    """Reshape arabic text for correct glyph joining + RTL ordering in Pillow.

    Pillow has no concept of bidi text — it just blits each codepoint in its
    isolated form left-to-right. We pre-shape via arabic_reshaper (joins the
    letters into their initial/medial/final forms) and then reverse the
    visual order with python-bidi so it reads right-to-left correctly when
    drawn by Pillow.
    """
    return get_display(arabic_reshaper.reshape(text))


def _draw_mixed(
    draw: ImageDraw.ImageDraw,
    xy: tuple[float, float],
    text: str,
    fonts: dict[str, ImageFont.FreeTypeFont],
    fill: tuple[int, int, int, int],
) -> None:
    """Draw a script-mixed string starting at top-left (x, y).

    All runs are aligned on a **common baseline** rather than on the
    ascender (Pillow's default ``anchor="la"``). Without this the Arabic
    runs — whose font has a taller ascent to make room for diacritics —
    would sit higher than Latin runs on the same line, leaving the Latin
    text visibly floating. Pinning to the baseline matches how browsers
    and word processors lay out mixed-script text.
    """
    runs = _runs(text)
    if not runs:
        return
    x, top = xy
    # The line's baseline = top + the tallest ascent across the participating
    # fonts. Each run is then drawn with anchor="ls" so its baseline lands
    # exactly there regardless of that font's individual ascent.
    max_ascent = max(fonts[script].getmetrics()[0] for _, script in runs)
    baseline = top + max_ascent
    for run, script in runs:
        font = fonts[script]
        draw.text((x, baseline), run, font=font, fill=fill, anchor="ls")
        x += draw.textlength(run, font=font)


def _measure_mixed(
    draw: ImageDraw.ImageDraw,
    text: str,
    fonts: dict[str, ImageFont.FreeTypeFont],
) -> float:
    """Total pixel width of a script-mixed string when drawn via _draw_mixed."""
    return sum(
        draw.textlength(run, font=fonts[script]) for run, script in _runs(text)
    )


def _circular_avatar(avatar_bytes: bytes, size: int) -> Image.Image:
    """Crop the given avatar PNG/JPEG to a circle of `size` px."""
    src = Image.open(io.BytesIO(avatar_bytes)).convert("RGBA")
    src = src.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(src, (0, 0), mask)
    return out


def render(
    avatar_bytes: bytes,
    nickname: str,
    member_number: int,
    tagline: str,
) -> bytes:
    """Render the welcome card and return its PNG bytes."""
    card = Image.new("RGBA", (CARD_W, CARD_H), BG)
    draw = ImageDraw.Draw(card)

    # Inner panel — slightly lighter than background to give depth.
    draw.rounded_rectangle(
        (20, 20, CARD_W - 20, CARD_H - 20),
        radius=24,
        fill=PANEL,
    )
    # Left accent stripe.
    draw.rounded_rectangle(
        (20, 40, 20 + ACCENT_BAR_W, CARD_H - 40),
        radius=6,
        fill=ACCENT,
    )

    # Avatar.
    avatar_y = (CARD_H - AVATAR_SIZE) // 2
    try:
        avatar_img = _circular_avatar(avatar_bytes, AVATAR_SIZE)
    except Exception as exc:  # noqa: BLE001
        log.warning("avatar decode failed; using placeholder: %s", exc)
        avatar_img = Image.new("RGBA", (AVATAR_SIZE, AVATAR_SIZE), (40, 60, 50, 255))
        ImageDraw.Draw(avatar_img).ellipse(
            (0, 0, AVATAR_SIZE, AVATAR_SIZE),
            fill=(40, 60, 50, 255),
            outline=ACCENT,
            width=4,
        )
    card.paste(avatar_img, (LEFT_PAD + ACCENT_BAR_W + 10, avatar_y), avatar_img)

    # Avatar ring outline.
    ring_box = (
        LEFT_PAD + ACCENT_BAR_W + 10 - 4,
        avatar_y - 4,
        LEFT_PAD + ACCENT_BAR_W + 10 + AVATAR_SIZE + 4,
        avatar_y + AVATAR_SIZE + 4,
    )
    draw.ellipse(ring_box, outline=ACCENT, width=4)

    # Text block on the right of the avatar.
    text_x = LEFT_PAD + ACCENT_BAR_W + 10 + AVATAR_SIZE + 50
    text_top = 70

    title_fonts = _load_fonts(56, bold=True)
    sub_fonts = _load_fonts(34)
    tag_fonts = _load_fonts(28)
    footer_fonts = _load_fonts(22)

    # ✨ (U+2728) lives in the Dingbats block which neither NotoNaskhArabic
    # nor NotoSans cover, so leaving it in would render as a tofu box just
    # like the Latin runs used to. Drop the decoration entirely — the title
    # reads cleanly without it and avoids a third (emoji) font pass.
    title_line = _ar(f"\u0623\u0647\u0644\u0627\u064b \u0648\u0633\u0647\u0644\u0627\u064b\u060c {nickname}")
    sub_line = _ar(f"\u0639\u0636\u0648\u0646\u0627 \u0631\u0642\u0645 {member_number} \u0641\u064a alitravians")
    tag_line = _ar(tagline)

    _draw_mixed(draw, (text_x, text_top), title_line, title_fonts, TEXT_PRIMARY)
    _draw_mixed(draw, (text_x, text_top + 80), sub_line, sub_fonts, TEXT_SECONDARY)
    _draw_mixed(draw, (text_x, text_top + 80 + 60), tag_line, tag_fonts, ACCENT)

    footer = _ar(
        "alitravians.community \u00b7 \u0645\u0633\u062a\u0639\u062f\u0651\u0648\u0646 \u0644\u0644\u0628\u062f\u0621"
    )
    fw = _measure_mixed(draw, footer, footer_fonts)
    _draw_mixed(
        draw,
        ((CARD_W - fw) / 2, CARD_H - 50),
        footer,
        footer_fonts,
        TEXT_FAINT,
    )

    buf = io.BytesIO()
    card.convert("RGB").save(buf, format="PNG", optimize=True)
    return buf.getvalue()


__all__ = ["render"]
