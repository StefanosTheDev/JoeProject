export interface Firm {
  id: string;
  name: string;
  websiteUrl: string;
  websiteAnalysis: WebsiteAnalysis | null;
  firmDescription: string;
  serviceModel: ServiceModel;
  aumRange: string;
  primaryFocus: string;
  geography: string;
  serviceRadius: string;
  credentials: string[];
  createdAt: string;
}

export interface WebsiteAnalysis {
  services: string[];
  clientTypes: string[];
  geographicMentions: string[];
  credentials: string[];
  tone: string;
  differentiators: string[];
  teamSize: string;
}

export interface ServiceModel {
  feeModels: string[];
  aumRange: string;
  primaryFocus: string;
}

export interface ClientProfile {
  ageRange: [number, number];
  situations: string[];
  avgHouseholdAum: string;
  householdCount: number;
}

export interface FirmProfile {
  id: string;
  firmId: string;
  firmDescription: string;
  serviceModel: ServiceModel;
  clientProfile: ClientProfile;
  geography: string;
  serviceRadius: string;
  credentials: string[];
  complianceFlags: Record<string, boolean>;
}

export interface IcpProfile {
  id: string;
  firmId: string;
  personaLabel: string;
  ageRange: [number, number];
  assetBand: string;
  lifeStage: string;
  primaryConcern: string;
  secondaryConcerns: string[];
  emotionalTriggers: string[];
  objections: string[];
  toneSetting: number;
  archetypeClassification: string;
  status: "draft" | "locked";
}

export interface OfferArchetype {
  id: string;
  name: string;
  description: string;
  bestFitIcpTypes: string[];
  ctaTemplate: string;
  meetingFormat: string;
  whyItFits?: string;
}

export interface Offer {
  id: string;
  archetypeId: string;
  firmId: string;
  icpId: string;
  meetingType: "in_person" | "virtual" | "phone";
  meetingLength: 30 | 45 | 60;
  customName: string;
  exclusions: string[];
  status: "draft" | "confirmed";
}

export interface Campaign {
  id: string;
  firmId: string;
  icpId: string;
  offerId: string;
  name: string;
  channel: "paid_social" | "email" | "organic";
  budgetRange: string;
  launchDate: string;
  status: "in_progress" | "approved" | "active" | "paused";
}

export type AssetCategory = "ad_creative" | "funnel_copy" | "sequences" | "call_prep";
export type AssetStatus = "draft" | "approved" | "removed" | "revising";

export interface Asset {
  id: string;
  assetSetId: string;
  category: AssetCategory;
  type: string;
  content: AssetContent;
  version: number;
  status: AssetStatus;
}

export interface AdCreativeContent {
  hook: string;
  primaryText: string;
  headline: string;
  description: string;
  cta: string;
  disclaimer?: string;
}

export interface FunnelSectionContent {
  sectionName: string;
  title: string;
  body: string;
  required: boolean;
}

export interface SequenceMessage {
  id: string;
  day: number;
  type: "email" | "sms";
  subject?: string;
  body: string;
  timing: string;
  status: AssetStatus;
}

export interface Sequence {
  id: string;
  name: string;
  description: string;
  messages: SequenceMessage[];
}

export interface CallPrepItem {
  id: string;
  type: "question" | "agenda" | "rebuttal" | "script";
  title: string;
  content: string;
  status: AssetStatus;
}

export type AssetContent =
  | AdCreativeContent
  | FunnelSectionContent
  | SequenceMessage
  | CallPrepItem;

export interface RevisionFeedback {
  type: string[];
  note: string;
}

export type WizardStep =
  | "firm-profile"
  | "icp"
  | "offer"
  | "campaign"
  | "assets"
  | "review"
  | "deploy";

export interface WizardState {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  firmProfile: {
    websiteUrl: string;
    websiteAnalysis: WebsiteAnalysis | null;
    firmDescription: string;
    serviceModel: ServiceModel;
    clientProfile: ClientProfile;
    geography: string;
    serviceRadius: string;
    credentials: string[];
    isAnalyzing: boolean;
    analysisComplete: boolean;
    subStep: number;
  };
  icp: {
    profile: IcpProfile | null;
    isGenerating: boolean;
    isLocked: boolean;
  };
  offer: {
    archetypes: OfferArchetype[];
    selectedArchetypeId: string | null;
    config: Omit<Offer, "id" | "archetypeId" | "firmId" | "icpId" | "status"> | null;
  };
  campaign: Campaign | null;
  assets: {
    activeCategory: AssetCategory;
    adCreative: Asset[];
    funnelCopy: Asset[];
    sequences: Sequence[];
    callPrep: CallPrepItem[];
    categoryStatus: Record<AssetCategory, "locked" | "generating" | "in_review" | "approved">;
  };
  compliance: {
    checks: [boolean, boolean, boolean];
    acknowledged: boolean;
  };
  deployment: {
    checklist: { label: string; completed: boolean }[];
    launched: boolean;
  };
}
