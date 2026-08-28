import { Navigate, Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Landing from "../pages/Landing";
import ConsumerDashboard from "../pages/ConsumerDashboard";
import FarmerDashboard from "../pages/FarmerDashboard";
import Login from "../pages/Login";
import Register from "../pages/Register";
import NotFound from "../pages/NotFound";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — blocks unauthenticated access and enforces role.
 *
 * While the initial /api/auth/me call is in-flight (loading=true) we render
 * nothing to avoid a flash-redirect to /login for users who ARE logged in.
 *
 * Props:
 *   requiredRole   "CONSUMER" | "FARMER"
 *   children
 */
function ProtectedRoute({ requiredRole, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Show nothing (or a tiny spinner) while auth state is being restored
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="font-mono text-xs text-ink-faint uppercase tracking-widest animate-pulse">
          Loading…
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Wrong role — send each user to their own dashboard
    return <Navigate to={user.role === "FARMER" ? "/farmer" : "/consumer"} replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"         element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/consumer"
          element={
            <ProtectedRoute requiredRole="CONSUMER">
              <ConsumerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer"
          element={
            <ProtectedRoute requiredRole="FARMER">
              <FarmerDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
