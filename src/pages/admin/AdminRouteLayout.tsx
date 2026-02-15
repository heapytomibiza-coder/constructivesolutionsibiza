import { Outlet } from "react-router-dom";
import { AdminDrawerProvider } from "./context/AdminDrawerContext";
import { JobDetailDrawer, UserDetailDrawer } from "./components";

export default function AdminRouteLayout() {
  return (
    <AdminDrawerProvider>
      <Outlet />
      <JobDetailDrawer />
      <UserDetailDrawer />
    </AdminDrawerProvider>
  );
}
