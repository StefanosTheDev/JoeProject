import { Routes, Route } from "react-router-dom";
import AppHub from "@/pages/AppHub";
import AmplifyOsLayout from "@/pages/amplify-os/Layout";
import FirmProfilePage from "@/pages/amplify-os/FirmProfilePage";
import IcpPage from "@/pages/amplify-os/IcpPage";
import OfferPage from "@/pages/amplify-os/OfferPage";
import CampaignPage from "@/pages/amplify-os/CampaignPage";
import AssetsPage from "@/pages/amplify-os/AssetsPage";
import ReviewPage from "@/pages/amplify-os/ReviewPage";
import DeployPage from "@/pages/amplify-os/DeployPage";
import AmplifyChat from "@/pages/amplify-chat/AmplifyChat";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppHub />} />
      <Route path="/amplify-os" element={<AmplifyOsLayout />}>
        <Route path="firm-profile" element={<FirmProfilePage />} />
        <Route path="icp" element={<IcpPage />} />
        <Route path="offer" element={<OfferPage />} />
        <Route path="campaign" element={<CampaignPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="deploy" element={<DeployPage />} />
      </Route>
      <Route path="/amplify-chat" element={<AmplifyChat />} />
    </Routes>
  );
}
