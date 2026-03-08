import { Routes, Route } from "react-router-dom";
import AppHub from "@/apps/AppHub";
import OnboardingChat from "@/apps/amplify-os/OnboardingChat";
import AmplifyChat from "@/apps/amplify-chat/AmplifyChat";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppHub />} />
      <Route path="/amplify-os" element={<OnboardingChat />} />
      <Route path="/amplify-chat" element={<AmplifyChat />} />
    </Routes>
  );
}
