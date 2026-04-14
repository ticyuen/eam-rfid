import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store";

export default function ProtectedRoute() {
  const { token } = useAuthStore();
  // const location = useLocation();
  // const { token, isSynced } = useAuthStore();

  // No token → Login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // // Token exists but not synced
  // if (!isSynced && location.pathname !== "/sync") {
  //   return <Navigate to="/sync" replace />;
  // }

  return <Outlet />;
}