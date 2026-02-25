import { forwardRef } from "react";
import { Outlet } from "react-router-dom";
import { AdminDrawerProvider } from "./context/AdminDrawerContext";
import { JobDetailDrawer, UserDetailDrawer } from "./components";

const AdminRouteLayout = forwardRef<HTMLDivElement>(function AdminRouteLayout(_props, _ref) {
  return (
    <AdminDrawerProvider>
      <Outlet />
      <JobDetailDrawer />
      <UserDetailDrawer />
    </AdminDrawerProvider>
  );
});

export default AdminRouteLayout;
