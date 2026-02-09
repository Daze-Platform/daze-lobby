import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { CircleDashed } from "@phosphor-icons/react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center px-4">
        <div className="relative inline-block mb-6">
          <CircleDashed 
            size={64} 
            weight="duotone" 
            className="text-orange-400 animate-pulse"
            style={{ 
              '--ph-duotone-opacity': 0.2 
            } as React.CSSProperties}
          />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">Oops! Page not found</p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-primary hover:text-primary/90 font-medium transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
