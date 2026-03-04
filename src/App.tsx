import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AccessDenied from "./pages/auth/AccessDenied";
import Dashboard from "./pages/Dashboard";
import Notifications from "./pages/Notifications";

// Farmer Pages
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import ImageUpload from "./pages/farmer/ImageUpload";
import PredictionResult from "./pages/farmer/PredictionResult";
import PredictionHistory from "./pages/farmer/PredictionHistory";
import FarmerProfile from "./pages/farmer/FarmerProfile";

// Officer Pages
import OfficerDashboard from "./pages/officer/OfficerDashboard";
import PendingReviews from "./pages/officer/PendingReviews";
import ReviewPrediction from "./pages/officer/ReviewPrediction";
import ReviewedPredictions from "./pages/officer/ReviewedPredictions";
import OfficerStatistics from "./pages/officer/OfficerStatistics";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import RoleAssignment from "./pages/admin/RoleAssignment";
import AuditLogs from "./pages/admin/AuditLogs";
import ModelManagement from "./pages/admin/ModelManagement";
import SystemMetrics from "./pages/admin/SystemMetrics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/access-denied" element={<AccessDenied />} />

            {/* Protected Routes - All Roles */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Farmer Routes */}
            <Route
              path="/farmer"
              element={
                <ProtectedRoute allowedRoles={["farmer", "officer", "admin"]}>
                  <DashboardLayout>
                    <FarmerDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute allowedRoles={["farmer", "officer", "admin"]}>
                  <DashboardLayout>
                    <ImageUpload />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/predictions"
              element={
                <ProtectedRoute allowedRoles={["farmer", "officer", "admin"]}>
                  <DashboardLayout>
                    <PredictionHistory />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/predictions/:id"
              element={
                <ProtectedRoute allowedRoles={["farmer", "officer", "admin"]}>
                  <DashboardLayout>
                    <PredictionResult />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={["farmer", "officer", "admin"]}>
                  <DashboardLayout>
                    <Notifications />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={["farmer", "officer", "admin"]}>
                  <DashboardLayout>
                    <FarmerProfile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Officer Routes */}
            <Route
              path="/officer"
              element={
                <ProtectedRoute allowedRoles={["officer", "admin"]}>
                  <DashboardLayout>
                    <OfficerDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/reviews"
              element={
                <ProtectedRoute allowedRoles={["officer", "admin"]}>
                  <DashboardLayout>
                    <PendingReviews />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/reviews/:id"
              element={
                <ProtectedRoute allowedRoles={["officer", "admin"]}>
                  <DashboardLayout>
                    <ReviewPrediction />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/statistics"
              element={
                <ProtectedRoute allowedRoles={["officer", "admin"]}>
                  <DashboardLayout>
                    <OfficerStatistics />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/reviewed"
              element={
                <ProtectedRoute allowedRoles={["officer", "admin"]}>
                  <DashboardLayout>
                    <ReviewedPredictions />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardLayout>
                    <AdminDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardLayout>
                    <UserManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardLayout>
                    <RoleAssignment />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardLayout>
                    <AuditLogs />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/metrics"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardLayout>
                    <SystemMetrics />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardLayout>
                    <AuditLogs />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/model"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardLayout>
                    <ModelManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
  </QueryClientProvider>
);

export default App;
