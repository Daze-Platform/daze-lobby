import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { RoleBasedRoute } from "@/components/layout/RoleBasedRoute";
import { AuthRedirect } from "@/components/layout/AuthRedirect";
import Dashboard from "./pages/Dashboard";
import Portal from "./pages/Portal";
import PortalPreview from "./pages/PortalPreview";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
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
              path="/portal"
              element={
                <RoleBasedRoute allowedRoles={["client"]}>
                  <Portal />
                </RoleBasedRoute>
              }
            />
            {/* Preview route - no auth required */}
            <Route path="/portal-preview" element={<PortalPreview />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
