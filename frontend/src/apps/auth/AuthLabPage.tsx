import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { getApiBase } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type WhoAmI = {
  sub: string;
  email?: string | null;
  role?: string | null;
  aud?: string | string[] | null;
  exp?: number | null;
  iat?: number | null;
};

export default function AuthLabPage() {
  const { user, signOut } = useAuth();
  const [whoAmI, setWhoAmI] = useState<WhoAmI | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadWhoAmI() {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const r = await fetch(`${getApiBase()}/api/auth/whoami`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) {
          const msg = await r.text();
          throw new Error(msg || "whoami failed");
        }
        const payload = (await r.json()) as WhoAmI;
        if (!cancelled) setWhoAmI(payload);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to fetch whoami");
      }
    }
    loadWhoAmI();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Auth Lab</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        Sandbox protected route for auth MVP only.
      </p>

      <div className="rounded border p-4 space-y-2">
        <div><strong>User ID:</strong> {user?.id ?? "n/a"}</div>
        <div><strong>Email:</strong> {user?.email ?? "n/a"}</div>
      </div>

      <div className="rounded border p-4 space-y-2">
        <h2 className="font-medium">Backend whoami</h2>
        {error ? <div className="text-sm text-red-500">{error}</div> : null}
        <pre className="text-xs overflow-auto">{JSON.stringify(whoAmI, null, 2)}</pre>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => signOut()}
          className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
        >
          Sign out
        </button>
        <Link to="/" className="inline-flex h-10 items-center justify-center rounded-md border px-4 py-2 text-sm">
          Back to app
        </Link>
      </div>
    </div>
  );
}

