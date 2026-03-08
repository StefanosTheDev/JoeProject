import { Routes, Route } from "react-router-dom";
import AppHub from "@/apps/AppHub";
import LoginPage from "@/apps/auth/LoginPage";
import OnboardingChat from "@/apps/amplify-os/OnboardingChat";
import MarketingBlueprint from "@/apps/amplify-os/MarketingBlueprint";
import ContentStudio from "@/apps/amplify-os/ContentStudio";
import AmplifyChat from "@/apps/amplify-chat/AmplifyChat";
import ExperienceHeyGenElevenLabs from "@/apps/experience-heygen-elevenlabs/ExperienceHeyGenElevenLabs";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppHub />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/amplify-os" element={<OnboardingChat />} />
      <Route path="/amplify-os/blueprint" element={<MarketingBlueprint />} />
      <Route path="/amplify-os/content-studio" element={<ContentStudio />} />
      <Route path="/amplify-chat" element={<AmplifyChat />} />
      <Route path="/experience-heygen-elevenlabs" element={<ExperienceHeyGenElevenLabs />} />
    </Routes>
  );
}
