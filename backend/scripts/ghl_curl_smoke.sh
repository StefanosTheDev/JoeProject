#!/usr/bin/env bash
# GHL API functional / curl smoke tests.
# Start backend first: cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000
set -e
BASE="${BASE:-http://localhost:8000/api/connect}"
FIRM="${FIRM_ID:-firm-1}"
FAIL=0

run() {
  local name="$1"
  local method="${2:-GET}"
  local url="$3"
  local data="$4"
  local accept_extra="$5"   # optional: "422" or "422,404,401" to still count as OK for this test
  echo ""
  echo "=== $name ==="
  if [ "$method" = "GET" ]; then
    resp=$(curl -s -w "\n%{http_code}" "$url")
  else
    resp=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" ${data:+-d "$data"})
  fi
  code=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d')
  echo "HTTP $code"
  echo "$body" | head -c 500
  [ ${#body} -gt 500 ] && echo "…"
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo "OK"
  elif [ -n "$accept_extra" ] && echo ",${accept_extra}," | grep -q ",${code},"; then
    echo "OK (known GHL limitation or missing param: $code)"
  else
    echo "FAIL (got $code)"
    FAIL=1
  fi
}

echo "GHL functional tests (BASE=$BASE, firm_id=$FIRM)"
run "1. connection" GET "$BASE/connection?firm_id=$FIRM"
run "2. test (GHL location)" GET "$BASE/test?firm_id=$FIRM"
run "3. custom-values GET" GET "$BASE/custom-values?firm_id=$FIRM"
run "4. contacts/search" POST "$BASE/contacts/search" "{\"firm_id\":\"$FIRM\",\"page_limit\":5}"
# GHL calendar: 422 without calendar_id + start_time + end_time (required by GHL)
run "5. calendar/events" GET "$BASE/calendar/events?firm_id=$FIRM" "" "422"
# Opportunities: we send locationId + location_id; expect 200 or 422 if GHL still rejects
run "6. opportunities/search" GET "$BASE/opportunities/search?firm_id=$FIRM" "" "422"
# Snapshots: we use GET /snapshots/ with locationId; expect 200 or 404
run "7. snapshots" GET "$BASE/snapshots?firm_id=$FIRM" "" "404,401"
# Funnels: 401 = GHL IAM not supporting this route yet
run "8. funnels" GET "$BASE/funnels?firm_id=$FIRM" "" "401,404"
run "9. webhooks (sample)" POST "$BASE/webhooks" '{"type":"ContactCreate","locationId":"test","contactId":"test"}'

echo ""
if [ $FAIL -eq 0 ]; then
  echo "All functional checks passed (2xx or known GHL limitation)."
  exit 0
else
  echo "One or more checks failed."
  exit 1
fi
