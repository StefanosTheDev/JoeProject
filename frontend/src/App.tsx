import { Routes, Route } from "react-router-dom";
import AppHub from "@/apps/AppHub";
import LoginPage from "@/apps/auth/LoginPage";
import OnboardingChat from "@/apps/amplify-os/OnboardingChat";
import AmplifyChat from "@/apps/amplify-chat/AmplifyChat";
import ExperienceHeyGenElevenLabs from "@/apps/experience-heygen-elevenlabs/ExperienceHeyGenElevenLabs";
import ConversationsInbox from "@/apps/conversations/ConversationsInbox";
import RegistrationPage from "@/apps/funnel/RegistrationPage";
import ThankYouPage from "@/apps/funnel/ThankYouPage";
import BookingPage from "@/apps/funnel/BookingPage";
import WebinarRoomPage from "@/apps/webinar/WebinarRoomPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppHub />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/amplify-os" element={<OnboardingChat />} />
      <Route path="/amplify-chat" element={<AmplifyChat />} />
      <Route path="/conversations" element={<ConversationsInbox />} />
      <Route path="/funnel/register" element={<RegistrationPage />} />
      <Route path="/funnel/thank-you" element={<ThankYouPage />} />
      <Route path="/funnel/book" element={<BookingPage />} />
      <Route path="/webinar/watch/:sessionId" element={<WebinarRoomPage />} />
      <Route path="/experience-heygen-elevenlabs" element={<ExperienceHeyGenElevenLabs />} />
    </Routes>
  );
}
