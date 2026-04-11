/**
 * Shared test render helper.
 * Wraps components with QueryClient + MemoryRouter.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface RenderOptions {
  route?: string;
  /** Additional routes for redirect assertions */
  additionalRoutes?: Array<{ path: string; element: React.ReactElement }>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { route = '/', additionalRoutes = [] }: RenderOptions = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });

  const hasRoutes = additionalRoutes.length > 0;

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        {hasRoutes ? (
          <Routes>
            <Route path={route.split('?')[0]} element={ui} />
            {additionalRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Routes>
        ) : (
          ui
        )}
      </MemoryRouter>
    </QueryClientProvider>
  );
}
