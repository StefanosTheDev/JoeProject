# GHL API — curl smoke tests

Run with backend at `http://localhost:8000`. Use `firm_id=firm-1` (or your connected firm).

## 1. Connection & auth

```bash
# Connection status (connected true/false, location_id, etc.)
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/connect/connection?firm_id=firm-1"

# Test GHL API (GET location details)
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/connect/test?firm_id=firm-1"
```

## 2. Custom values

```bash
# GET custom values
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/connect/custom-values?firm_id=firm-1"

# POST create (then use returned id for PUT/DELETE)
curl -s -w "\nHTTP %{http_code}\n" -X POST "http://localhost:8000/api/connect/custom-values" \
  -H "Content-Type: application/json" \
  -d '{"firm_id":"firm-1","name":"curl_test_key","value":"curl_test_value"}'

# PUT update (replace CUSTOM_VALUE_ID with id from POST response)
# curl -s -w "\nHTTP %{http_code}\n" -X PUT "http://localhost:8000/api/connect/custom-values/CUSTOM_VALUE_ID" \
#   -H "Content-Type: application/json" \
#   -d '{"firm_id":"firm-1","value":"updated_value"}'

# DELETE (replace CUSTOM_VALUE_ID)
# curl -s -w "\nHTTP %{http_code}\n" -X DELETE "http://localhost:8000/api/connect/custom-values/CUSTOM_VALUE_ID?firm_id=firm-1"
```

## 3. Contacts

```bash
# POST search contacts
curl -s -w "\nHTTP %{http_code}\n" -X POST "http://localhost:8000/api/connect/contacts/search" \
  -H "Content-Type: application/json" \
  -d '{"firm_id":"firm-1","query":"test","page_limit":5}'

# POST create contact (optional)
# curl -s -w "\nHTTP %{http_code}\n" -X POST "http://localhost:8000/api/connect/contacts" \
#   -H "Content-Type: application/json" \
#   -d '{"firm_id":"firm-1","firstName":"Curl","lastName":"Test","email":"curl-test@example.com"}'
```

## 4. Calendar, opportunities, snapshots, funnels

```bash
# Calendar events
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/connect/calendar/events?firm_id=firm-1"

# Opportunities search
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/connect/opportunities/search?firm_id=firm-1"

# Snapshots
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/connect/snapshots?firm_id=firm-1"

# Funnels
curl -s -w "\nHTTP %{http_code}\n" "http://localhost:8000/api/connect/funnels?firm_id=firm-1"
```

## 5. Webhook (POST sample payload)

```bash
# Returns 200; if GHL_WEBHOOK_SIGNING_SECRET is set, omit or use valid X-HighLevel-Signature
curl -s -w "\nHTTP %{http_code}\n" -X POST "http://localhost:8000/api/connect/webhooks" \
  -H "Content-Type: application/json" \
  -d '{"type":"ContactCreate","locationId":"wyuEXzuPBOV1Z95QMWl6","contactId":"test_contact_123"}'
```
