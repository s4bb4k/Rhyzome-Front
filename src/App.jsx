
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";

import Dashboard from "./features/dashboard/pages/Dashboard";
import MyMaps from "./features/maps/pages/MyMaps";

import { AuthProvider } from "./features/auth/context/AuthContext";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";

function App() {
  return (
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Rutas protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/maps" element={<MyMaps />} />
            </Route>

            {/* Rutas desconocidas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
  );
}

export default App;
