import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/auth-context";

export function ProtectedRoute() {
  const location = useLocation();
  // Subscribing to the auth context (rather than reading localStorage) is what
  // makes the redirect fire the moment a logout or an expired session happens.
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
