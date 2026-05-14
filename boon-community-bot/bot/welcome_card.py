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

# Locations of arabic / latin fonts inside the image. fonts-noto-naskh-arabic
# is the slim package; fall back to DejaVuSans if it's somehow missing.
_FONT_CANDIDATES: Iterable[str] = (
    "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf",
    "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
)


def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Find the first available font on disk and return it at `size`.

    Weight matching is symmetric: a `bold=False` request never returns a
    Bold-named candidate, and vice versa. ``DejaVuSans`` is treated as
    weight-neutral (it's only the last-ditch latin fallback, used for
    both bold and regular labels when the Noto family is unavailable).
    """
    for path in _FONT_CANDIDATES:
        is_bold = "Bold" in path
        is_neutral = "DejaVu" in path  # weight-agnostic latin fallback
        if bold and not (is_bold or is_neutral):
            continue
        if not bold and is_bold and not is_neutral:
            continue
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    # Last-ditch fallback: pillow's bundled default. Looks ugly but won't crash.
    log.warning("no arabic-capable font on disk; falling back to default")
    return ImageFont.load_default()


def _ar(text: str) -> str:
    """Reshape arabic text for correct glyph joining + RTL ordering in Pillow.

    Pillow has no concept of bidi text — it just blits each codepoint in its
    isolated form left-to-right. We pre-shape via arabic_reshaper (joins the
    letters into their initial/medial/final forms) and then reverse the
    visual order with python-bidi so it reads right-to-left correctly when
    drawn by Pillow.
    """
    return get_display(arabic_reshaper.reshape(text))


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

    title_font = _load_font(56, bold=True)
    sub_font = _load_font(34)
    tag_font = _load_font(28)
    footer_font = _load_font(22)

    title_line = _ar(f"\u2728 \u0623\u0647\u0644\u0627\u064b \u0648\u0633\u0647\u0644\u0627\u064b\u060c {nickname}")
    sub_line = _ar(f"\u0639\u0636\u0648\u0646\u0627 \u0631\u0642\u0645 {member_number} \u0641\u064a alitravians")
    tag_line = _ar(tagline)

    draw.text((text_x, text_top), title_line, font=title_font, fill=TEXT_PRIMARY)
    draw.text((text_x, text_top + 80), sub_line, font=sub_font, fill=TEXT_SECONDARY)
    draw.text((text_x, text_top + 80 + 60), tag_line, font=tag_font, fill=ACCENT)

    footer = _ar("alitravians.community \u00b7 \u0645\u0633\u062a\u0639\u062f\u0651\u0648\u0646 \u0644\u0644\u0628\u062f\u0621")
    fw = draw.textlength(footer, font=footer_font)
    draw.text(
        ((CARD_W - fw) / 2, CARD_H - 50),
        footer,
        font=footer_font,
        fill=TEXT_FAINT,
    )

    buf = io.BytesIO()
    card.convert("RGB").save(buf, format="PNG", optimize=True)
    return buf.getvalue()


__all__ = ["render"]
