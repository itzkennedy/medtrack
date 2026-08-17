import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import PatientDashboard from "./pages/PatientDashboard.jsx";
import CaregiverDashboard from "./pages/CaregiverDashboard.jsx";
import "./index.css";

/**
 * App root — Sprint 0 uses hardcoded routing.
 * Auth context + protected routes land in Sprint 1.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PatientDashboard />} />
        <Route path="/caregiver" element={<CaregiverDashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
