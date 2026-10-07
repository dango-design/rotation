#!/usr/bin/env bash
# Capture retina screenshots of the Rotation app (web/) in demo mode for the process log.
# Usage: scripts/screenshots-app.sh <milestone-folder-name>
# Expects a production server: (cd web && npm run build && npx next start -p 3100)
set -uo pipefail

name="${1:?usage: scripts/screenshots-app.sh <milestone-name>}"
out="docs/process/screens/$name"
base="${BASE_URL:-http://localhost:3100}"
chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$out"

# file:path:height
shots=(
  "today:/:1480" "closet:/closet:1500" "builder:/builder:1200" "fill:/fill:2700"
  "planner:/planner:1000" "insights:/insights:1150" "settings:/settings:1300" "about:/about:1100"
)

shoot() { # url file height; a fresh profile per shot so a lingering instance can't block the next one
  local profile; profile="$(mktemp -d)"
  "$chrome" --headless=new --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$profile" \
    --force-device-scale-factor=2 --window-size="1440,$3" --virtual-time-budget=6000 \
    --screenshot="$PWD/$2" "$1" >/dev/null 2>&1 &
  local pid=$! waited=0
  while kill -0 "$pid" 2>/dev/null && (( waited < 45 )); do sleep 1; ((waited++)); done
  kill "$pid" 2>/dev/null
  rm -rf "$profile"
  [[ -s "$2" ]] && echo "ok   $2" || echo "FAIL $2"
}

for shot in "${shots[@]}"; do
  IFS=: read -r file path height <<<"$shot"
  shoot "$base$path?demo" "$out/$file.png" "$height"
done
