import { Routes, Route } from "react-router-dom";
import AppHub from "@/apps/AppHub";
import AmplifyOsLayout from "@/apps/amplify-os/Layout";
import FirmProfilePage from "@/apps/amplify-os/FirmProfilePage";
import IcpPage from "@/apps/amplify-os/IcpPage";
import OfferPage from "@/apps/amplify-os/OfferPage";
import CampaignPage from "@/apps/amplify-os/CampaignPage";
import AssetsPage from "@/apps/amplify-os/AssetsPage";
import ReviewPage from "@/apps/amplify-os/ReviewPage";
import DeployPage from "@/apps/amplify-os/DeployPage";
import AmplifyChat from "@/apps/amplify-chat/AmplifyChat";

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
