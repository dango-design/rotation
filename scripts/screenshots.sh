#!/usr/bin/env bash
# Capture retina screenshots of every prototype screen for the process log.
# Usage: scripts/screenshots.sh <milestone-folder-name>   (prototype must be served on :4173)
set -uo pipefail

name="${1:?usage: scripts/screenshots.sh <milestone-name>}"
out="docs/process/screens/$name"
base="${BASE_URL:-http://localhost:4173}"
chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$out"

# view:height pairs; heights fit each screen's content at 1440px wide
shots=(
  "today:1480" "closet:1400" "builder:1000" "fill:2650"
  "planner:1180" "insights:1150" "journey:1320"
)

shoot() { # url file height — fresh profile per shot so a lingering instance can't block the next one
  local profile; profile="$(mktemp -d)"
  "$chrome" --headless=new --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$profile" \
    --force-device-scale-factor=2 --window-size="1440,$3" --virtual-time-budget=4000 \
    --screenshot="$PWD/$2" "$1" >/dev/null 2>&1 &
  local pid=$! waited=0
  while kill -0 "$pid" 2>/dev/null && (( waited < 40 )); do sleep 1; ((waited++)); done
  kill "$pid" 2>/dev/null
  rm -rf "$profile"
  [[ -s "$2" ]] && echo "ok   $2" || echo "FAIL $2"
}

for shot in "${shots[@]}"; do
  view="${shot%%:*}"; height="${shot##*:}"
  shoot "$base/#$view" "$out/$view.png" "$height"
  shoot "$base/?notes#$view" "$out/$view-notes.png" "$height"
done
