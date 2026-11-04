import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import AdminPage from "./pages/AdminPage";
import StaffPage from "./pages/StaffPage";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import PageTransition from "./components/PageTransition";

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "manager") return <Navigate to="/staff" replace />;
  return <Navigate to="/dashboard" replace />;
}

function AnimatedPage({ children }) {
  return <PageTransition>{children}</PageTransition>;
}

export default function App() {
  const { loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-kpit-purple-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
        <Route path="/register" element={<AnimatedPage><RegisterPage /></AnimatedPage>} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<AnimatedPage><HomeRedirect /></AnimatedPage>} />
          <Route path="/dashboard" element={<ProtectedRoute roles={["user", "manager"]}><AnimatedPage><DashboardPage /></AnimatedPage></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute roles={["user"]}><AnimatedPage><OrdersPage /></AnimatedPage></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute roles={["manager"]}><AnimatedPage><StaffPage /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AnimatedPage><AdminPage /></AnimatedPage></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}