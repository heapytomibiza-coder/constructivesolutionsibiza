import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type DrawerEntityType = "job" | "user";

interface DrawerState {
  type: DrawerEntityType;
  id: string;
}

interface AdminDrawerContextValue {
  state: DrawerState | null;
  open: boolean;
  openDrawer: (entity: DrawerState) => void;
  closeDrawer: () => void;
}

const AdminDrawerContext = createContext<AdminDrawerContextValue | null>(null);

export function AdminDrawerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DrawerState | null>(null);
  const [open, setOpen] = useState(false);

  const openDrawer = useCallback((entity: DrawerState) => {
    setState(entity);
    setOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setOpen(false);
    // Delay clearing state so close animation completes
    setTimeout(() => setState(null), 300);
  }, []);

  return (
    <AdminDrawerContext.Provider value={{ state, open, openDrawer, closeDrawer }}>
      {children}
    </AdminDrawerContext.Provider>
  );
}

export function useAdminDrawer() {
  const ctx = useContext(AdminDrawerContext);
  if (!ctx) throw new Error("useAdminDrawer must be used within AdminDrawerProvider");
  return ctx;
}
