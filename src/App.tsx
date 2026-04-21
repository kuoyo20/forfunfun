import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import HRDashboard from "@/pages/HRDashboard";
import CreateInterview from "@/pages/CreateInterview";
import CandidateInterview from "@/pages/CandidateInterview";
import InterviewReport from "@/pages/InterviewReport";
import Practice from "@/pages/Practice";
import SupplementUpload from "@/pages/SupplementUpload";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Toaster position="top-right" />
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Routes>
            <Route path="/" element={<HRDashboard />} />
            <Route path="/create" element={<CreateInterview />} />
            <Route path="/interview/:token" element={<CandidateInterview />} />
            <Route path="/report/:id" element={<InterviewReport />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/supplement/:token" element={<SupplementUpload />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
