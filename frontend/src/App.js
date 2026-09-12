import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Overview from "@/pages/Overview";
import TestConsole from "@/pages/TestConsole";
import PolicyEditor from "@/pages/PolicyEditor";
import AuditLog from "@/pages/AuditLog";
import Settings from "@/pages/Settings";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/test" element={<TestConsole />} />
          <Route path="/policy" element={<PolicyEditor />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
