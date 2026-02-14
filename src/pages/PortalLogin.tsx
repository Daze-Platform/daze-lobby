import { useSearchParams } from "react-router-dom";
import { ClientLoginForm } from "@/components/auth/ClientLoginForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { SketchyArtPanel } from "@/components/auth/SketchyArtPanel";

export default function PortalLogin() {
  const [searchParams] = useSearchParams();
  const isReset = searchParams.get("reset") === "1" || window.location.hash.includes("type=recovery");

  return (
    <div className="h-screen overflow-hidden flex flex-col lg:flex-row">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-4 sm:p-6 md:p-8 lg:p-12 h-full" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="w-full max-w-md">
          {isReset ? (
            <ResetPasswordForm redirectTo="/portal/login" />
          ) : (
            <ClientLoginForm />
          )}
        </div>
      </div>

      {/* Right Side - The Sketchy Art Panel (hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-1/2 relative h-full">
        <SketchyArtPanel />
      </div>

      {/* Mobile/Tablet gradient background overlay */}
      <div 
        className="fixed inset-0 -z-10 lg:hidden"
        style={{
          background: "linear-gradient(135deg, hsl(24 95% 98%) 0%, hsl(24 90% 96%) 100%)"
        }}
      />
    </div>
  );
}
