import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Spec §9.13 — 404 page */}
      <p className="text-[6rem] font-bold leading-none text-teal-100 select-none">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-teal-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-xs text-base text-gray-500">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button
        className="mt-8"
        onClick={() => navigate('/')}
      >
        Return to home
      </Button>
    </div>
  );
};

export default NotFound;
