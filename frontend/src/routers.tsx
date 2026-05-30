import { Routes, Route, Navigate } from "react-router-dom";
import ReactorSyncPage from "./modules/simon-says/pages/ReactorSyncPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/simon-says" replace />} />
      <Route path="/simon-says" element={<ReactorSyncPage />} />
    </Routes>
  );
}
