import { ClientLoginForm } from "@/components/auth/ClientLoginForm";
import { SketchyArtPanel } from "@/components/auth/SketchyArtPanel";

export default function PortalLogin() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - The Client Login Form (Clean White) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-4 sm:p-6 md:p-8 lg:p-12 min-h-screen lg:min-h-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="w-full max-w-md">
          <ClientLoginForm />
        </div>
      </div>

      {/* Right Side - The Sketchy Art Panel (hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-1/2 relative min-h-screen">
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
