import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import { resolveTenant } from "./api";

export interface TenantState {
  firmId: string | null;
  defaultCampaignId: string | null;
  baseUrl: string;
  source: "custom_domain" | "subdomain" | null;
  isLoading: boolean;
  error: Error | null;
}

const defaultState: TenantState = {
  firmId: null,
  defaultCampaignId: null,
  baseUrl: typeof window !== "undefined" ? window.location.origin : "",
  source: null,
  isLoading: true,
  error: null,
};

const TenantContext = createContext<TenantState | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TenantState>(() => ({
    ...defaultState,
    baseUrl: typeof window !== "undefined" ? window.location.origin : "",
    isLoading: true,
  }));

  const resolve = useCallback(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    resolveTenant(host)
      .then((data) => {
        setState({
          firmId: data.firm_id,
          defaultCampaignId: data.default_campaign_id ?? null,
          baseUrl: window.location.origin,
          source: data.source,
          isLoading: false,
          error: null,
        });
      })
      .catch((err) => {
        setState((s) => ({
          ...s,
          firmId: null,
          defaultCampaignId: null,
          baseUrl: window.location.origin,
          source: null,
          isLoading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      });
  }, []);

  useEffect(() => {
    resolve();
  }, [resolve]);

  return (
    <TenantContext.Provider value={state}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): TenantState {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    return {
      ...defaultState,
      baseUrl: typeof window !== "undefined" ? window.location.origin : "",
    };
  }
  return ctx;
}

/**
 * Effective firm and campaign for funnel/webinar pages: query params override tenant context.
 */
export function useTenantFirmCampaign(
  defaultFirmId: string,
  defaultCampaignId: string
): { firmId: string; campaignId: string; baseUrl: string } {
  const [searchParams] = useSearchParams();
  const tenant = useTenant();
  const firmId =
    searchParams.get("firm_id") ?? tenant.firmId ?? defaultFirmId;
  const campaignId =
    searchParams.get("campaign_id") ??
    tenant.defaultCampaignId ??
    defaultCampaignId;
  const baseUrl = tenant.baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return { firmId, campaignId, baseUrl };
}
