/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { ThemeProvider } from "./ThemeContext";

// Layouts
import { MainLayout } from "./layouts/MainLayout";

// Guards
import { UserProtectedRoute } from "./components/guards/ProtectedRoute";
import { AdminRoute } from "./components/guards/AdminRoute";
import { SuperAdminRoute } from "./components/guards/SuperAdminRoute";

// Public Pages
import LandingPage from "./pages/LandingPage";
import TermsAndConditions from "./pages/TermsAndConditions";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import AdminSignupGate from "./pages/auth/AdminSignupGate";
import VaultLogin from "./pages/auth/VaultLogin";
import VaultSignup from "./pages/auth/VaultSignup";
import StaffLogin from "./pages/auth/StaffLogin";

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

// Super Admin Pages
import SuperDashboard from "./pages/superadmin/Dashboard";
import ManageAdmins from "./pages/superadmin/ManageAdmins";
import AuditLogs from "./pages/superadmin/AuditLogs";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Hidden internal routes (Manual access only) */}
        <Route path="/company/vault" element={<AdminSignupGate />} />
        <Route path="/company/vault/login" element={<VaultLogin />} />
        <Route path="/company/vault/signup" element={<VaultSignup />} />
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
            </Route>

            {/* Super Admin Access */}
            <Route element={<SuperAdminRoute />}>
              <Route path="/superadmin" element={<SuperDashboard />} />
              <Route path="/superadmin/admins" element={<ManageAdmins />} />
              <Route path="/superadmin/audit" element={<AuditLogs />} />
            </Route>
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
