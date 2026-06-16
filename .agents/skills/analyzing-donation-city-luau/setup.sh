#!/usr/bin/env bash
# يُنصّب أدوات تحليل Luau (selene + luau-analyze) في ~/.local/bin.
# آمن لإعادة التشغيل: يتخطّى التنزيل لو الأداة منصّبة مسبقاً.
# الاستخدام:  bash .agents/skills/analyzing-donation-city-luau/setup.sh
set -euo pipefail

SELENE_VERSION="0.31.0"
LUAU_VERSION="0.725"
BIN_DIR="${HOME}/.local/bin"
mkdir -p "$BIN_DIR"
export PATH="$BIN_DIR:$PATH"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# selene — لينتر يدعم مكتبة Roblox القياسية (std = "roblox")
if ! command -v selene >/dev/null 2>&1; then
  echo "==> تنزيل selene ${SELENE_VERSION}"
  curl -fsSL -o "$tmp/selene.zip" \
    "https://github.com/Kampfkarren/selene/releases/download/${SELENE_VERSION}/selene-${SELENE_VERSION}-linux.zip"
  unzip -oq "$tmp/selene.zip" -d "$BIN_DIR"
  chmod +x "$BIN_DIR/selene"
else
  echo "==> selene منصّب مسبقاً ($(selene --version))"
fi

# luau-analyze — المحلّل الرسمي من luau-lang (للينتات المنطقية مثل MisleadingAndOr)
if ! command -v luau-analyze >/dev/null 2>&1; then
  echo "==> تنزيل luau ${LUAU_VERSION} (يحوي luau-analyze)"
  curl -fsSL -o "$tmp/luau.zip" \
    "https://github.com/luau-lang/luau/releases/download/${LUAU_VERSION}/luau-ubuntu.zip"
  unzip -oq "$tmp/luau.zip" -d "$BIN_DIR"
  chmod +x "$BIN_DIR/luau-analyze" || true
else
  echo "==> luau-analyze منصّب مسبقاً"
fi

echo "تم. تأكّد أن ${BIN_DIR} ضمن PATH."
