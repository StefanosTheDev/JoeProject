import { Routes, Route } from "react-router-dom";
import { TenantProvider } from "@/apps/tenant/TenantContext";
import RootSwitch from "@/apps/RootSwitch";
import LoginPage from "@/apps/auth/LoginPage";
import SignupPage from "@/apps/auth/SignupPage";
import RequireAuth from "@/apps/auth/RequireAuth";
import AuthLabPage from "@/apps/auth/AuthLabPage";
import OnboardingChat from "@/apps/amplify-os/OnboardingChat";
import MarketingBlueprint from "@/apps/amplify-os/MarketingBlueprint";
import ContentStudio from "@/apps/amplify-os/ContentStudio";
import AmplifyChat from "@/apps/amplify-chat/AmplifyChat";
import ExperienceHeyGenElevenLabs from "@/apps/experience-heygen-elevenlabs/ExperienceHeyGenElevenLabs";
import ConversationsInbox from "@/apps/conversations/ConversationsInbox";
import RegistrationPage from "@/apps/funnel/RegistrationPage";
import ThankYouPage from "@/apps/funnel/ThankYouPage";
import BookingPage from "@/apps/funnel/BookingPage";
import WebinarRoomPage from "@/apps/webinar/WebinarRoomPage";

export default function App() {
  return (
    <TenantProvider>
    <Routes>
      <Route path="/" element={<RootSwitch />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth-lab" element={<RequireAuth><AuthLabPage /></RequireAuth>} />
      <Route path="/amplify-os" element={<OnboardingChat />} />
      <Route path="/amplify-os/blueprint" element={<MarketingBlueprint />} />
      <Route path="/amplify-os/content-studio" element={<ContentStudio />} />
      <Route path="/amplify-chat" element={<AmplifyChat />} />
      <Route path="/conversations" element={<ConversationsInbox />} />
      <Route path="/funnel/register" element={<RegistrationPage />} />
      <Route path="/register/:eventSlug" element={<RegistrationPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="/funnel/thank-you" element={<ThankYouPage />} />
      <Route path="/funnel/book" element={<BookingPage />} />
      <Route path="/webinar/watch/:sessionId" element={<WebinarRoomPage />} />
      <Route path="/experience-heygen-elevenlabs" element={<ExperienceHeyGenElevenLabs />} />
    </Routes>
    </TenantProvider>
  );
}
