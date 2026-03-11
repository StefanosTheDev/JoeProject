import { Link } from "react-router-dom";
import { LoginForm } from "./LoginForm";

export default function SignupPage() {
  return (
    <div className="shadcn-theme dark grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <Link
            to="/"
            className="font-medium text-[var(--foreground)]"
          >
            Amplify OS
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm mode="signup" />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-[var(--muted)] lg:block">
        <img
          src="/placeholder.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
      </div>
    </div>
  );
}

