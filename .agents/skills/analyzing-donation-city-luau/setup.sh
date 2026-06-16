#!/usr/bin/env bash
# يُنصّب أدوات تحليل Luau (selene + luau-analyze) في ~/.local/bin.
# آمن لإعادة التشغيل (idempotent): يعيد التنزيل فقط لو الأداة غير منصّبة أو
# نسختها لا تطابق النسخة المثبّتة أدناه — فبتغيير ثابت النسخة وحده يعاد التنصيب.
# الاستخدام:  bash .agents/skills/analyzing-donation-city-luau/setup.sh
set -euo pipefail

SELENE_VERSION="0.31.0"
LUAU_VERSION="0.725"
BIN_DIR="${HOME}/.local/bin"
# علامة تسجّل النسخ المنصّبة (luau-analyze لا يملك --version فنعتمد عليها له).
MARKER="${BIN_DIR}/.donation-city-luau-tools"
mkdir -p "$BIN_DIR"
export PATH="$BIN_DIR:$PATH"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

marker_get() { [ -f "$MARKER" ] && grep -E "^$1=" "$MARKER" | head -1 | cut -d= -f2- || true; }
marker_set() { # key value
  mkdir -p "$(dirname "$MARKER")"; touch "$MARKER"
  grep -vE "^$1=" "$MARKER" > "$MARKER.tmp" 2>/dev/null || true
  echo "$1=$2" >> "$MARKER.tmp"; mv "$MARKER.tmp" "$MARKER"
}

# selene — لينتر يدعم مكتبة Roblox القياسية (std = "roblox")
# له --version فنقرأ النسخة الفعلية مباشرة بدل الاعتماد على العلامة.
selene_cur=""
command -v selene >/dev/null 2>&1 && selene_cur="$(selene --version 2>/dev/null | awk '{print $2}')"
if [ "$selene_cur" != "$SELENE_VERSION" ]; then
  echo "==> تنزيل selene ${SELENE_VERSION} (المنصّب: ${selene_cur:-لا شيء})"
  curl -fsSL -o "$tmp/selene.zip" \
    "https://github.com/Kampfkarren/selene/releases/download/${SELENE_VERSION}/selene-${SELENE_VERSION}-linux.zip"
  unzip -oq "$tmp/selene.zip" -d "$BIN_DIR"
  chmod +x "$BIN_DIR/selene"
else
  echo "==> selene ${SELENE_VERSION} منصّب مسبقاً"
fi

# luau-analyze — المحلّل الرسمي من luau-lang (للينتات المنطقية مثل MisleadingAndOr)
# لا يملك --version فنتتبّع النسخة عبر ملف العلامة.
if ! command -v luau-analyze >/dev/null 2>&1 || [ "$(marker_get luau)" != "$LUAU_VERSION" ]; then
  echo "==> تنزيل luau ${LUAU_VERSION} (يحوي luau-analyze؛ المسجّل: $(marker_get luau || echo 'لا شيء'))"
  curl -fsSL -o "$tmp/luau.zip" \
    "https://github.com/luau-lang/luau/releases/download/${LUAU_VERSION}/luau-ubuntu.zip"
  unzip -oq "$tmp/luau.zip" -d "$BIN_DIR"
  chmod +x "$BIN_DIR/luau-analyze" || true
  marker_set luau "$LUAU_VERSION"
else
  echo "==> luau-analyze ${LUAU_VERSION} منصّب مسبقاً"
fi

echo "تم. تأكّد أن ${BIN_DIR} ضمن PATH."
