#!/usr/bin/env bash
# Capture the Rotation app's screens (web/, demo closet) for the process log. All app screens are now taken by
# screenshots-flows.mjs, in one browser that cuts out the demo's photos first; this name is kept for old notes.
# Usage: scripts/screenshots-app.sh <milestone-folder-name>
# Expects a production server: (cd web && npm run build && npx next start -p 3100)
set -euo pipefail
exec node "$(dirname "$0")/screenshots-flows.mjs" "${1:?usage: scripts/screenshots-app.sh <milestone-name>}"
