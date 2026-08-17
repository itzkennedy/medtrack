import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import PatientDashboard from "./pages/PatientDashboard.jsx";
import CaregiverDashboard from "./pages/CaregiverDashboard.jsx";
import "./index.css";

function ProtectedRoute({ children, allowedRole }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRole && user && user.role !== allowedRole) {
    return <Navigate to={user.role === "caregiver" ? "/caregiver" : "/dashboard"} replace />;
  }
  return children;
}

function GuestRoute({ children }) {
  const { token, user } = useAuth();
  if (token && user) {
    return <Navigate to={user.role === "caregiver" ? "/caregiver" : "/dashboard"} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute allowedRole="patient"><PatientDashboard /></ProtectedRoute>} />
      <Route path="/caregiver" element={<ProtectedRoute allowedRole="caregiver"><CaregiverDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
