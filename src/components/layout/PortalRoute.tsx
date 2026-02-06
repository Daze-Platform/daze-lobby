import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";
import { Loader2 } from "lucide-react";
import { isClient, hasDashboardAccess } from "@/lib/auth";
import NoHotelAssigned from "@/pages/NoHotelAssigned";

interface PortalRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route for the Client Portal with multi-tenancy enforcement:
 * 1. Must be authenticated
 * 2. Must be a client OR an admin (admin can view any hotel)
 * 3. Clients MUST have a hotel assigned - redirect to error page if not
 */
export function PortalRoute({ children }: PortalRouteProps) {
  const { isAuthenticated, loading: authLoading, role } = useAuthContext();
  const { hotelId, isLoading: hotelLoading, error } = useHotel();

  const isAdmin = hasDashboardAccess(role);

  // Still loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check role - must be client or admin
  if (!isClient(role) && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // For clients only: check if hotel is assigned
  if (isClient(role) && !isAdmin) {
    // Still loading hotel
    if (hotelLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    // No hotel assigned - show error page
    if (error === "no_hotel_assigned" || !hotelId) {
      return <NoHotelAssigned />;
    }
  }

  // Admins can proceed without hotel (they'll select one in the portal)
  return <>{children}</>;
}
