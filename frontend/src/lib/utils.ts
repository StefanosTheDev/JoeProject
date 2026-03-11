import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Base URL for API (e.g. https://your-backend.railway.app). Empty in dev so /api uses Vite proxy. */
export function getApiBase(): string {
  const url = import.meta.env.VITE_API_URL;
  return url ? String(url).replace(/\/$/, "") : "";
}
