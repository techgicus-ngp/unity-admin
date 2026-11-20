import { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageLoader } from '@/components/ui/Spinner';
import { HomeRedirect, PublicOnly, RequireAuth } from './guards';

// Route-level code splitting: each page is its own chunk.
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'));
const OverviewPage = lazy(() => import('@/features/overview/OverviewPage'));
const EmployeeListPage = lazy(() => import('@/features/employees/EmployeeListPage'));
const QuotationListPage = lazy(() => import('@/features/quotations/QuotationListPage'));
const QuotationFormPage = lazy(() => import('@/features/quotations/QuotationFormPage'));
const QuotationDetailPage = lazy(() => import('@/features/quotations/QuotationDetailPage'));
const DashboardPage = lazy(() => import('@/features/plots/DashboardPage'));
const GalleryPage = lazy(() => import('@/features/gallery/GalleryPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomeRedirect />} />

          {/* Tab pages (inside the shell) */}
          <Route element={<AppShell />}>
            <Route path="/quotations" element={<QuotationListPage />} />
            <Route element={<RequireAuth adminOnly />}>
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/employees" element={<EmployeeListPage />} />
            </Route>
          </Route>

          {/* Pushed pages (full screen, with a back button) */}
          <Route path="/quotations/new" element={<QuotationFormPage />} />
          <Route path="/quotations/:id" element={<QuotationDetailPage />} />
          <Route path="/quotations/:id/edit" element={<QuotationFormPage />} />

          <Route element={<RequireAuth adminOnly />}>
            <Route path="/layouts" element={<DashboardPage />} />
            <Route path="/layouts/:mapId/gallery" element={<GalleryPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
