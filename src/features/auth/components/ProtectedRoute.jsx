
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
    const { session, loading } = useAuth();

    if (loading) {
        return <div>Validando sesión...</div>;
    }

    if (!session) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
