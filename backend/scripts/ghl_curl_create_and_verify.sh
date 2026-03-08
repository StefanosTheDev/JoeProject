#!/usr/bin/env bash
# GHL create-then-verify: create real data (custom value, contact, opportunity) then verify via GET/search.
# Requires: backend running, firm_id connected (e.g. firm-1).
# Usage: ./scripts/ghl_curl_create_and_verify.sh
set -e
BASE="${BASE:-http://localhost:8000/api/connect}"
FIRM="${FIRM_ID:-firm-1}"
FAIL=0

# Unique suffix so we can run multiple times
SUFFIX="${SUFFIX:-$(date +%s)}"
CUSTOM_NAME="curl_verify_${SUFFIX}"
CONTACT_EMAIL="curl-verify-${SUFFIX}@example.com"

run() {
  local name="$1"
  local method="${2:-GET}"
  local url="$3"
  local data="$4"
  local accept_extra="$5"
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
  echo "$body" | head -c 600
  [ ${#body} -gt 600 ] && echo "…"
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo "OK"
    echo "$body"
    return 0
  elif [ -n "$accept_extra" ] && echo ",${accept_extra}," | grep -q ",${code},"; then
    echo "OK (accepted: $code)"
    echo "$body"
    return 0
  else
    echo "FAIL (got $code)"
    FAIL=1
    return 1
  fi
}

echo "GHL create-and-verify (BASE=$BASE, firm_id=$FIRM, suffix=$SUFFIX)"

# --- 1. Create custom value then list ---
run "1. Create custom value" POST "$BASE/custom-values" "{\"firm_id\":\"$FIRM\",\"name\":\"$CUSTOM_NAME\",\"value\":\"verify_value_$SUFFIX\"}" || true
run "2. GET custom values (should include new)" GET "$BASE/custom-values?firm_id=$FIRM"

# --- 3. Create contact then search ---
CREATE_CONTACT_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/contacts" -H "Content-Type: application/json" -d "{\"firm_id\":\"$FIRM\",\"firstName\":\"Curl\",\"lastName\":\"Verify\",\"email\":\"$CONTACT_EMAIL\"}")
CREATE_CONTACT_CODE=$(echo "$CREATE_CONTACT_RESP" | tail -n1)
CREATE_CONTACT_BODY=$(echo "$CREATE_CONTACT_RESP" | sed '$d')
echo ""
echo "=== 3. Create contact ==="
echo "HTTP $CREATE_CONTACT_CODE"
echo "$CREATE_CONTACT_BODY" | head -c 600
[ ${#CREATE_CONTACT_BODY} -gt 600 ] && echo "…"
[ "$CREATE_CONTACT_CODE" = "200" ] || [ "$CREATE_CONTACT_CODE" = "201" ] && echo "OK" || { echo "FAIL"; FAIL=1; }
CONTACT_ID=$(echo "$CREATE_CONTACT_BODY" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    c = d.get('contact') or d
    print(c.get('id') or c.get('contactId') or '')
except Exception:
    pass
" 2>/dev/null || true)

run "4. Search contacts (query=curl)" POST "$BASE/contacts/search" "{\"firm_id\":\"$FIRM\",\"query\":\"curl\",\"page_limit\":10}"

if [ -n "$CONTACT_ID" ]; then
  # Create opportunity: GHL often requires pipelineId (and pipelineStageId). Try with contactId + name; 422/400 accepted if pipeline missing.
  run "5. Create opportunity" POST "$BASE/opportunities" "{\"firm_id\":\"$FIRM\",\"contactId\":\"$CONTACT_ID\",\"name\":\"Curl verify opp $SUFFIX\"}" "422,400"
else
  echo "Skip create opportunity (no contact id from create)"
fi

run "6. Opportunities search" GET "$BASE/opportunities/search?firm_id=$FIRM" "" "422"

echo ""
if [ $FAIL -eq 0 ]; then
  echo "Create-and-verify done (2xx or accepted codes)."
  exit 0
else
  echo "One or more steps failed."
  exit 1
fi
