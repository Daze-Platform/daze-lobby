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
import { DedicatedPortalRoute } from "@/components/layout/DedicatedPortalRoute";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Blockers from "./pages/Blockers";
import Devices from "./pages/Devices";
import Revenue from "./pages/Revenue";
import Portal from "./pages/Portal";
import PortalLogin from "./pages/PortalLogin";
import PortalAdmin from "./pages/PortalAdmin";
import PortalPreview from "./pages/PortalPreview";
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
              {/* Dedicated client portal routes - must be before /portal */}
              <Route path="/portal/springhill-orange-beach" element={
                <DedicatedPortalRoute>
                  <PortalPreview clientName="Springhill Suites Orange Beach" />
                </DedicatedPortalRoute>
              } />
              <Route path="/portal/daze-beach-resort" element={
                <DedicatedPortalRoute>
                  <PortalPreview clientName="Daze Beach Resort" />
                </DedicatedPortalRoute>
              } />
              {/* Admin Portal Viewer - Control Tower users only */}
              <Route
                path="/portal/admin"
                element={
                  <RoleBasedRoute allowedRoles={["admin", "ops_manager", "support"]}>
                    <PortalAdmin />
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
              {/* Client portal - after specific /portal/* routes */}
              <Route
                path="/portal"
                element={
                  <PortalRoute>
                    <Portal />
                  </PortalRoute>
                }
              />
              {/* Redirect old preview route */}
              <Route path="/portal-preview" element={<Navigate to="/portal/daze-beach-resort" replace />} />
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
