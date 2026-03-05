"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import type {
  WizardState,
  WizardStep,
  AssetCategory,
  IcpProfile,
  Asset,
  Sequence,
  CallPrepItem,
  WebsiteAnalysis,
  ServiceModel,
  ClientProfile,
  OfferArchetype,
  Campaign,
  AssetStatus,
} from "./types";

const STEPS: WizardStep[] = [
  "firm-profile",
  "icp",
  "offer",
  "campaign",
  "assets",
  "review",
  "deploy",
];

const initialState: WizardState = {
  currentStep: "firm-profile",
  completedSteps: [],
  firmProfile: {
    websiteUrl: "",
    websiteAnalysis: null,
    firmDescription: "",
    serviceModel: { feeModels: [], aumRange: "", primaryFocus: "" },
    clientProfile: {
      ageRange: [55, 70],
      situations: [],
      avgHouseholdAum: "",
      householdCount: 0,
    },
    geography: "",
    serviceRadius: "",
    credentials: [],
    isAnalyzing: false,
    analysisComplete: false,
    subStep: 0,
  },
  icp: { profile: null, isGenerating: false, isLocked: false },
  offer: { archetypes: [], selectedArchetypeId: null, config: null },
  campaign: null,
  assets: {
    activeCategory: "ad_creative",
    adCreative: [],
    funnelCopy: [],
    sequences: [],
    callPrep: [],
    categoryStatus: {
      ad_creative: "locked",
      funnel_copy: "locked",
      sequences: "locked",
      call_prep: "locked",
    },
  },
  compliance: { checks: [false, false, false], acknowledged: false },
  deployment: { checklist: [], launched: false },
};

export type WizardAction =
  | { type: "SET_STEP"; step: WizardStep }
  | { type: "COMPLETE_STEP"; step: WizardStep }
  | { type: "SET_FIRM_SUBSTEP"; subStep: number }
  | { type: "SET_WEBSITE_URL"; url: string }
  | { type: "START_ANALYSIS" }
  | { type: "COMPLETE_ANALYSIS"; analysis: WebsiteAnalysis; description: string; credentials: string[] }
  | { type: "SET_FIRM_DESCRIPTION"; description: string }
  | { type: "SET_SERVICE_MODEL"; model: ServiceModel }
  | { type: "SET_CLIENT_PROFILE"; profile: ClientProfile }
  | { type: "SET_GEOGRAPHY"; geography: string; serviceRadius: string; credentials: string[] }
  | { type: "START_ICP_GENERATION" }
  | { type: "SET_ICP"; profile: IcpProfile }
  | { type: "UPDATE_ICP"; updates: Partial<IcpProfile> }
  | { type: "LOCK_ICP" }
  | { type: "SET_OFFER_ARCHETYPES"; archetypes: OfferArchetype[] }
  | { type: "SELECT_OFFER"; archetypeId: string }
  | { type: "CONFIGURE_OFFER"; config: WizardState["offer"]["config"] }
  | { type: "SET_CAMPAIGN"; campaign: Campaign }
  | { type: "SET_ACTIVE_CATEGORY"; category: AssetCategory }
  | { type: "SET_CATEGORY_STATUS"; category: AssetCategory; status: WizardState["assets"]["categoryStatus"][AssetCategory] }
  | { type: "SET_AD_CREATIVE"; assets: Asset[] }
  | { type: "SET_FUNNEL_COPY"; assets: Asset[] }
  | { type: "SET_SEQUENCES"; sequences: Sequence[] }
  | { type: "SET_CALL_PREP"; items: CallPrepItem[] }
  | { type: "UPDATE_ASSET_STATUS"; category: AssetCategory; assetId: string; status: AssetStatus }
  | { type: "UPDATE_SEQUENCE_MESSAGE_STATUS"; sequenceId: string; messageId: string; status: AssetStatus }
  | { type: "UPDATE_CALL_PREP_STATUS"; itemId: string; status: AssetStatus }
  | { type: "SET_COMPLIANCE_CHECK"; index: number; checked: boolean }
  | { type: "ACKNOWLEDGE_COMPLIANCE" }
  | { type: "SET_DEPLOYMENT_CHECKLIST"; checklist: { label: string; completed: boolean }[] }
  | { type: "TOGGLE_CHECKLIST_ITEM"; index: number }
  | { type: "MARK_LAUNCHED" };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step };

    case "COMPLETE_STEP":
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.step)
          ? state.completedSteps
          : [...state.completedSteps, action.step],
      };

    case "SET_FIRM_SUBSTEP":
      return {
        ...state,
        firmProfile: { ...state.firmProfile, subStep: action.subStep },
      };

    case "SET_WEBSITE_URL":
      return {
        ...state,
        firmProfile: { ...state.firmProfile, websiteUrl: action.url },
      };

    case "START_ANALYSIS":
      return {
        ...state,
        firmProfile: { ...state.firmProfile, isAnalyzing: true },
      };

    case "COMPLETE_ANALYSIS":
      return {
        ...state,
        firmProfile: {
          ...state.firmProfile,
          isAnalyzing: false,
          analysisComplete: true,
          websiteAnalysis: action.analysis,
          firmDescription: action.description,
          credentials: action.credentials,
        },
      };

    case "SET_FIRM_DESCRIPTION":
      return {
        ...state,
        firmProfile: { ...state.firmProfile, firmDescription: action.description },
      };

    case "SET_SERVICE_MODEL":
      return {
        ...state,
        firmProfile: { ...state.firmProfile, serviceModel: action.model },
      };

    case "SET_CLIENT_PROFILE":
      return {
        ...state,
        firmProfile: { ...state.firmProfile, clientProfile: action.profile },
      };

    case "SET_GEOGRAPHY":
      return {
        ...state,
        firmProfile: {
          ...state.firmProfile,
          geography: action.geography,
          serviceRadius: action.serviceRadius,
          credentials: action.credentials,
        },
      };

    case "START_ICP_GENERATION":
      return {
        ...state,
        icp: { ...state.icp, isGenerating: true },
      };

    case "SET_ICP":
      return {
        ...state,
        icp: { ...state.icp, profile: action.profile, isGenerating: false },
      };

    case "UPDATE_ICP":
      return {
        ...state,
        icp: {
          ...state.icp,
          profile: state.icp.profile
            ? { ...state.icp.profile, ...action.updates }
            : null,
        },
      };

    case "LOCK_ICP":
      return {
        ...state,
        icp: {
          ...state.icp,
          isLocked: true,
          profile: state.icp.profile
            ? { ...state.icp.profile, status: "locked" }
            : null,
        },
      };

    case "SET_OFFER_ARCHETYPES":
      return {
        ...state,
        offer: { ...state.offer, archetypes: action.archetypes },
      };

    case "SELECT_OFFER":
      return {
        ...state,
        offer: { ...state.offer, selectedArchetypeId: action.archetypeId },
      };

    case "CONFIGURE_OFFER":
      return {
        ...state,
        offer: { ...state.offer, config: action.config },
      };

    case "SET_CAMPAIGN":
      return { ...state, campaign: action.campaign };

    case "SET_ACTIVE_CATEGORY":
      return {
        ...state,
        assets: { ...state.assets, activeCategory: action.category },
      };

    case "SET_CATEGORY_STATUS":
      return {
        ...state,
        assets: {
          ...state.assets,
          categoryStatus: {
            ...state.assets.categoryStatus,
            [action.category]: action.status,
          },
        },
      };

    case "SET_AD_CREATIVE":
      return {
        ...state,
        assets: { ...state.assets, adCreative: action.assets },
      };

    case "SET_FUNNEL_COPY":
      return {
        ...state,
        assets: { ...state.assets, funnelCopy: action.assets },
      };

    case "SET_SEQUENCES":
      return {
        ...state,
        assets: { ...state.assets, sequences: action.sequences },
      };

    case "SET_CALL_PREP":
      return {
        ...state,
        assets: { ...state.assets, callPrep: action.items },
      };

    case "UPDATE_ASSET_STATUS": {
      const key = action.category === "ad_creative" ? "adCreative" : "funnelCopy";
      return {
        ...state,
        assets: {
          ...state.assets,
          [key]: state.assets[key].map((a: Asset) =>
            a.id === action.assetId ? { ...a, status: action.status } : a
          ),
        },
      };
    }

    case "UPDATE_SEQUENCE_MESSAGE_STATUS":
      return {
        ...state,
        assets: {
          ...state.assets,
          sequences: state.assets.sequences.map((seq) =>
            seq.id === action.sequenceId
              ? {
                  ...seq,
                  messages: seq.messages.map((msg) =>
                    msg.id === action.messageId
                      ? { ...msg, status: action.status }
                      : msg
                  ),
                }
              : seq
          ),
        },
      };

    case "UPDATE_CALL_PREP_STATUS":
      return {
        ...state,
        assets: {
          ...state.assets,
          callPrep: state.assets.callPrep.map((item) =>
            item.id === action.itemId ? { ...item, status: action.status } : item
          ),
        },
      };

    case "SET_COMPLIANCE_CHECK":
      return {
        ...state,
        compliance: {
          ...state.compliance,
          checks: state.compliance.checks.map((c, i) =>
            i === action.index ? action.checked : c
          ) as [boolean, boolean, boolean],
        },
      };

    case "ACKNOWLEDGE_COMPLIANCE":
      return {
        ...state,
        compliance: { ...state.compliance, acknowledged: true },
      };

    case "SET_DEPLOYMENT_CHECKLIST":
      return {
        ...state,
        deployment: { ...state.deployment, checklist: action.checklist },
      };

    case "TOGGLE_CHECKLIST_ITEM":
      return {
        ...state,
        deployment: {
          ...state.deployment,
          checklist: state.deployment.checklist.map((item, i) =>
            i === action.index ? { ...item, completed: !item.completed } : item
          ),
        },
      };

    case "MARK_LAUNCHED":
      return {
        ...state,
        deployment: { ...state.deployment, launched: true },
      };

    default:
      return state;
  }
}

const STEP_ROUTES: Record<WizardStep, string> = {
  "firm-profile": "/amplify-os/firm-profile",
  icp: "/amplify-os/icp",
  offer: "/amplify-os/offer",
  campaign: "/amplify-os/campaign",
  assets: "/amplify-os/assets",
  review: "/amplify-os/review",
  deploy: "/amplify-os/deploy",
};

const WizardContext = createContext<{
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  steps: WizardStep[];
  stepRoutes: Record<WizardStep, string>;
  canNavigateTo: (step: WizardStep) => boolean;
  goToStep: (step: WizardStep) => void;
  nextStep: () => WizardStep | null;
} | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  function canNavigateTo(step: WizardStep): boolean {
    const idx = STEPS.indexOf(step);
    if (idx === 0) return true;
    const prev = STEPS[idx - 1];
    return state.completedSteps.includes(prev);
  }

  function goToStep(step: WizardStep) {
    if (canNavigateTo(step)) {
      dispatch({ type: "SET_STEP", step });
    }
  }

  function nextStep(): WizardStep | null {
    const idx = STEPS.indexOf(state.currentStep);
    if (idx < STEPS.length - 1) {
      dispatch({ type: "COMPLETE_STEP", step: state.currentStep });
      const next = STEPS[idx + 1];
      dispatch({ type: "SET_STEP", step: next });
      return next;
    }
    return null;
  }

  return (
    <WizardContext.Provider
      value={{ state, dispatch, steps: STEPS, stepRoutes: STEP_ROUTES, canNavigateTo, goToStep, nextStep }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
