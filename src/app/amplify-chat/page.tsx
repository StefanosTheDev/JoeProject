import Link from "next/link";

export default function AmplifyChat() {
  return (
    <div className="flex min-h-dvh flex-col px-6">
      <nav className="flex items-center py-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to App Hub
        </Link>
      </nav>
      <div className="flex flex-1 flex-col items-center justify-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Amplify Chat
        </h1>
        <p className="mt-3 text-foreground-muted">
          This application is under construction.
        </p>
      </div>
    </div>
  );
}
