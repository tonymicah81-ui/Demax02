import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { ThemeProvider } from "./ThemeContext";
import { LoadingScreen } from "./components/ui/LoadingScreen";

// Layouts
import { MainLayout } from "./layouts/MainLayout";
import PublicLayout from "./pages/public/PublicLayout";

// Guards
import { UserProtectedRoute } from "./components/guards/ProtectedRoute";
import { AdminRoute } from "./components/guards/AdminRoute";
import { SuperAdminRoute } from "./components/guards/SuperAdminRoute";

// Vault Gate
import { VaultGate } from "./components/vault/VaultGate";

// Public Pages
import LandingPage from "./pages/LandingPage";
import TermsAndConditions from "./pages/TermsAndConditions";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import AdminSignupGate from "./pages/auth/AdminSignupGate";
import VaultLogin from "./pages/auth/VaultLogin";
import VaultSignup from "./pages/auth/VaultSignup";
import StaffLogin from "./pages/auth/StaffLogin";
import Store from "./pages/public/Store";
import VerifyReceipt from "./pages/public/VerifyReceipt";

// User Pages
import UserDashboard from "./pages/user/Dashboard";
import Projects from "./pages/user/Projects";
import Marketplace from "./pages/user/Marketplace";
import Support from "./pages/user/Support";
import Profile from "./pages/user/Profile";
import Subscription from "./pages/user/Subscription";
import Wallet from "./pages/user/Wallet";
import Notifications from "./pages/user/Notifications";
import Cart from "./pages/user/Cart";
import Orders from "./pages/user/Orders";
import UserSessions from "./pages/user/Sessions";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import ManageUsers from "./pages/admin/Users";
import AdminChats from "./pages/admin/Chats";
import UserDetails from "./pages/admin/UserDetails";
import AdminIssues from "./pages/admin/Issues";
import ManageMarketplace from "./pages/admin/Marketplace";
import ManagePayments from "./pages/admin/Payments";
import ManageFixes from "./pages/admin/Fixes";
import BroadcastSystem from "./pages/admin/Broadcast";
import AdminProjects from "./pages/admin/Projects";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminSessions from "./pages/admin/Sessions";

// Super Admin Pages
import SuperDashboard from "./pages/superadmin/Dashboard";
import ManageAdmins from "./pages/superadmin/ManageAdmins";
import AuditLogs from "./pages/superadmin/AuditLogs";
import PlatformSettings from "./pages/superadmin/PlatformSettings";

function LoadingWrapper({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const [minWait, setMinWait] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setMinWait(false), 800);
    return () => clearTimeout(t);
  }, []);

  const visible = loading || minWait;

  return (
    <>
      <LoadingScreen visible={visible} />
      <div style={{ visibility: visible ? "hidden" : "visible" }}>
        {children}
      </div>
    </>
  );
}

function AppRoutes() {
  return (
    <Router>
      <LoadingWrapper>
        <Routes>
          {/* PUBLIC — no auth required */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify/:receiptNumber" element={<VerifyReceipt />} />

          {/* PUBLIC STORE — browsable without login, with PublicLayout navbar */}
          <Route element={<PublicLayout />}>
            <Route path="/store" element={<Store />} />
          </Route>

          {/* VAULT — all vault routes wrapped in VaultGate */}
          <Route path="/company/vault" element={<VaultGate><AdminSignupGate /></VaultGate>} />
          <Route path="/company/vault/login" element={<VaultGate><VaultLogin /></VaultGate>} />
          <Route path="/company/vault/signup" element={<VaultGate><VaultSignup /></VaultGate>} />
          <Route path="/company/staff" element={<StaffLogin />} />

          {/* PROTECTED DASHBOARD ROUTES */}
          <Route element={<UserProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* User Access */}
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/support" element={<Support />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/sessions" element={<UserSessions />} />

              {/* Admin Access */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<ManageUsers />} />
                <Route path="/admin/users/:userId" element={<UserDetails />} />
                <Route path="/admin/chats" element={<AdminChats />} />
                <Route path="/admin/issues" element={<AdminIssues />} />
                <Route path="/admin/marketplace" element={<ManageMarketplace />} />
                <Route path="/admin/payments" element={<ManagePayments />} />
                <Route path="/admin/fixes" element={<ManageFixes />} />
                <Route path="/admin/broadcast" element={<BroadcastSystem />} />
                <Route path="/admin/projects" element={<AdminProjects />} />
                <Route path="/admin/transactions" element={<AdminTransactions />} />
                <Route path="/admin/sessions" element={<AdminSessions />} />
              </Route>

              {/* Super Admin Access */}
              <Route element={<SuperAdminRoute />}>
                <Route path="/superadmin" element={<SuperDashboard />} />
                <Route path="/superadmin/admins" element={<ManageAdmins />} />
                <Route path="/superadmin/audit" element={<AuditLogs />} />
                <Route path="/superadmin/settings" element={<PlatformSettings />} />
              </Route>
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LoadingWrapper>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
