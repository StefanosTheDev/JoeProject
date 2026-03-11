import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const inputClass =
  "flex h-10 w-full rounded-md border bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] ring-offset-[var(--background)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2";
const labelClass = "text-sm font-medium leading-none";
const borderStyle = { borderColor: "var(--input)" };

export function LoginForm({ mode = "login" }: { mode?: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = (location.state as { from?: string } | undefined)?.from || "/auth-lab";

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.session) {
          navigate("/auth-lab", { replace: true });
          return;
        }
        setMessage("Check your email to confirm your account, then log in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate(nextPath, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const redirectTo = `${window.location.origin}/auth-lab`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (oauthError) setError(oauthError.message);
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {isSignup ? "Create your account" : "Login to your account"}
          </h1>
          <p className="text-sm text-balance text-[var(--muted-foreground)]">
            {isSignup
              ? "Use your email and password or continue with Google"
              : "Enter your email below to login to your account"}
          </p>
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-500">{message}</p> : null}

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            style={borderStyle}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <Link
              to="/login/forgot"
              className="ml-auto text-sm text-[var(--muted-foreground)] underline-offset-4 hover:underline hover:text-[var(--foreground)]"
            >
              Forgot your password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            style={borderStyle}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
        >
          {submitting ? "Please wait..." : isSignup ? "Create account" : "Login"}
        </button>

        {/* Or continue with */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" style={{ borderColor: "var(--border)" }} />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--background)] px-2 text-[var(--muted-foreground)]">
              Or continue with
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border bg-transparent px-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
          style={borderStyle}
        >
          <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          {isSignup ? "Already have an account? " : "Don’t have an account? "}
          {isSignup ? (
            <Link to="/login" className="underline underline-offset-4 hover:text-[var(--foreground)]">
              Login
            </Link>
          ) : (
            <Link to="/signup" className="underline underline-offset-4 hover:text-[var(--foreground)]">
              Sign up
            </Link>
          )}
        </p>
      </div>
    </form>
  );
}
