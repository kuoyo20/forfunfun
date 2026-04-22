import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import AdminLayout from "@/layouts/AdminLayout";
import HRDashboard from "@/pages/HRDashboard";
import CreateInterview from "@/pages/CreateInterview";
import CandidateInterview from "@/pages/CandidateInterview";
import InterviewReport from "@/pages/InterviewReport";
import Practice from "@/pages/Practice";
import SupplementUpload from "@/pages/SupplementUpload";
import BulkCreate from "@/pages/BulkCreate";
import Compare from "@/pages/Compare";
import Jobs from "@/pages/Jobs";
import TalentPool from "@/pages/TalentPool";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* 後台（HR 端）— 側欄佈局 */}
        <Route element={<AdminLayout />}>
          <Route path="/" element={<HRDashboard />} />
          <Route path="/create" element={<CreateInterview />} />
          <Route path="/bulk" element={<BulkCreate />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/talent" element={<TalentPool />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/report/:id" element={<InterviewReport />} />
        </Route>

        {/* 候選人端 — 全螢幕 */}
        <Route path="/interview/:token" element={
          <div className="min-h-screen bg-background">
            <CandidateInterview />
          </div>
        } />
        <Route path="/supplement/:token" element={
          <div className="min-h-screen bg-background">
            <SupplementUpload />
          </div>
        } />

        {/* 自主練習 */}
        <Route path="/practice" element={
          <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-2xl px-4 py-8">
              <Practice />
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
