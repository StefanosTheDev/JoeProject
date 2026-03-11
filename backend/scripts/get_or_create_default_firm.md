# Get or create default firm for messaging

Use one of the options below. The result is a **firm id** (a long hex string like `a1b2c3d4e5f6...`). Put it in `.env` as:

```env
MESSAGING_DEFAULT_FIRM_ID=that-id-here
```

---

## Option A: You already have firms in the database

### Step 1: Connect to your database

- **Local Postgres:** Open Terminal and run:
  ```bash
  cd backend
  psql "$(grep '^DATABASE_URL=' .env | cut -d= -f2-)" -c "SELECT id, name FROM firm LIMIT 10;"
  ```
  (If that fails because `.env` has special characters, use Step 1b.)

- **Supabase:** Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**. Run:
  ```sql
  SELECT id, name FROM firm LIMIT 10;
  ```

### Step 2: Copy a firm id

From the result, copy the value in the **id** column for the firm you want to use as the default (e.g. your main advisory firm). That is your `MESSAGING_DEFAULT_FIRM_ID`.

### Step 3: Add to `.env`

In `backend/.env` add (replace with your actual id):

```env
MESSAGING_DEFAULT_FIRM_ID=your-firm-id-from-step-2
```

---

## Option B: You don't have any firms yet

### Step 1: Insert one firm

Run this SQL once (in Supabase SQL Editor or via `psql`):

```sql
INSERT INTO firm (id, name)
VALUES ('default', 'Default Firm')
ON CONFLICT (id) DO NOTHING;
```

Or to let the database generate a random id:

```sql
INSERT INTO firm (name)
VALUES ('Default Firm')
RETURNING id;
```

### Step 2: Get the id

- If you used the first version, the firm id is literally **`default`**.
- If you used the second version, the query output shows the new id in the `RETURNING id` column. Copy it.

### Step 3: Add to `.env`

In `backend/.env` add:

```env
MESSAGING_DEFAULT_FIRM_ID=default
```

or, if you used the second SQL, the id that was returned:

```env
MESSAGING_DEFAULT_FIRM_ID=the-returned-id
```

---

## Option C: Use the script (easiest)

From the `backend` folder run:

```bash
python3 scripts/get_or_create_default_firm.py
```

The script will:
1. List existing firms and print their ids, or
2. If there are none, create a firm named "Default Firm" with id `default` and print it.

Then add the printed id to `.env` as `MESSAGING_DEFAULT_FIRM_ID=...`.
