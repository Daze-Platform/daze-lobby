import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { RoleBasedRoute } from "@/components/layout/RoleBasedRoute";
import { AuthRedirect } from "@/components/layout/AuthRedirect";
import { PortalRoute } from "@/components/layout/PortalRoute";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Blockers from "./pages/Blockers";
import Devices from "./pages/Devices";
import Revenue from "./pages/Revenue";
import PortalLogin from "./pages/PortalLogin";
import PortalAdmin from "./pages/PortalAdmin";
import PortalBySlug from "./pages/PortalBySlug";
import AdminPortalBySlug from "./pages/AdminPortalBySlug";
import Auth from "./pages/Auth";
import PostAuth from "./pages/PostAuth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ClientProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route 
                path="/auth" 
                element={
                  <AuthRedirect>
                    <Auth />
                  </AuthRedirect>
                } 
              />
              <Route path="/post-auth" element={<PostAuth />} />
              <Route
                path="/"
                element={
                  <RoleBasedRoute allowedRoles={["admin", "ops_manager", "support"]}>
                    <Dashboard />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RoleBasedRoute allowedRoles={["admin", "ops_manager", "support"]}>
                    <Dashboard />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <RoleBasedRoute allowedRoles={["admin", "ops_manager", "support"]}>
                    <Clients />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/blockers"
                element={
                  <RoleBasedRoute allowedRoles={["admin", "ops_manager", "support"]}>
                    <Blockers />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/devices"
                element={
                  <RoleBasedRoute allowedRoles={["admin", "ops_manager", "support"]}>
                    <Devices />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/revenue"
                element={
                  <RoleBasedRoute allowedRoles={["admin", "ops_manager", "support"]}>
                    <Revenue />
                  </RoleBasedRoute>
                }
              />
              {/* Admin Portal - client picker */}
              <Route
                path="/admin/portal"
                element={
                  <RoleBasedRoute allowedRoles={["admin", "ops_manager", "support"]}>
                    <PortalAdmin />
                  </RoleBasedRoute>
                }
              />
              {/* Admin Portal - viewing specific client by slug */}
              <Route
                path="/admin/portal/:clientSlug"
                element={
                  <RoleBasedRoute allowedRoles={["admin", "ops_manager", "support"]}>
                    <AdminPortalBySlug />
                  </RoleBasedRoute>
                }
              />
              {/* Client login - separate from admin /auth */}
              <Route 
                path="/portal/login" 
                element={
                  <AuthRedirect>
                    <PortalLogin />
                  </AuthRedirect>
                } 
              />
              {/* Client portal by slug */}
              <Route
                path="/portal/:clientSlug"
                element={
                  <PortalRoute>
                    <PortalBySlug />
                  </PortalRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ClientProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
