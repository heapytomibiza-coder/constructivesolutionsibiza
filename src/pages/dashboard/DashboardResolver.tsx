import { Navigate } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { getDashboardPath } from "@/app/routes";

export default function DashboardResolver() {
  const { activeRole, isLoading } = useSession();

  if (isLoading) return null;

  if (!activeRole) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={getDashboardPath(activeRole)} replace />;
}
