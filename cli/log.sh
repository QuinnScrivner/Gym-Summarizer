#!/usr/bin/env bash
API="http://localhost:4000"
KEY="dev-local-key-change-me"

set -euo pipefail

# start workout
wid=$(curl -s -X POST "$API/workouts" \
  -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{}' | jq -r '.id')

echo "Workout started (id: $wid). Enter sets. Empty exercise to finish."
while true; do
  read -rp "Exercise: " ex
  [[ -z "$ex" ]] && break
  read -rp "Weight: " wt
  read -rp "Reps: " rp
  read -rp "RPE (optional): " rpe

  payload=$(jq -n --arg ex "$ex" --argjson wt "$wt" --argjson rp "$rp" --arg rpe "${rpe:-}" \
    --argjson wid "$wid" \
    '{workout_id:$wid, exercise:$ex, weight:$wt, reps:$rp} + ( ( $rpe|length ) as $len | if $len>0 then {rpe: ($rpe|tonumber)} else {} end )')

  curl -s -X POST "$API/sets" \
    -H "x-api-key: $KEY" -H "Content-Type: application/json" \
    -d "$payload" >/dev/null
  echo "Logged: $ex $wt x $rp"
done

echo "Done. Weekly summary:"
curl -s -H "x-api-key: $KEY" "$API/summary/week" | jq .
