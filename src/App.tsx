import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { HotelProvider } from "@/contexts/HotelContext";
import { RoleBasedRoute } from "@/components/layout/RoleBasedRoute";
import { AuthRedirect } from "@/components/layout/AuthRedirect";
import { PortalRoute } from "@/components/layout/PortalRoute";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Blockers from "./pages/Blockers";
import Devices from "./pages/Devices";
import Revenue from "./pages/Revenue";
import Portal from "./pages/Portal";
import PortalPreview from "./pages/PortalPreview";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <HotelProvider>
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
              <Route
                path="/portal"
                element={
                  <PortalRoute>
                    <Portal />
                  </PortalRoute>
                }
              />
              {/* Preview route - no auth required */}
              <Route path="/portal-preview" element={<PortalPreview />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </HotelProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
