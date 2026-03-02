import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import EntitlementGate from "@/components/EntitlementGate";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";

// Lazy-loaded routes (code-splitting)
const Ranking = lazy(() => import("./pages/Ranking"));
const Perfil = lazy(() => import("./pages/Perfil"));
const DayDetail = lazy(() => import("./pages/DayDetail"));
const Cuaderno = lazy(() => import("./pages/Cuaderno"));
const Deposito = lazy(() => import("./pages/Deposito"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminMonthChecklist = lazy(() => import("./pages/AdminMonthChecklist"));
const MonthDetail = lazy(() => import("./pages/MonthDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const CalendarioAno = lazy(() => import("./pages/CalendarioAno"));
const CalendarioMes = lazy(() => import("./pages/CalendarioMes"));
const ResolveLegacyDayRoute = lazy(() => import("./pages/ResolveLegacyDayRoute"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const SupportPage = lazy(() => import("./pages/Support"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AdminMonthDaysRedirect = () => {
  const { monthId } = useParams();
  return <Navigate to={`/admin/months/${monthId}/checklist`} replace />;
};

// Route loading fallback
const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,     // 2 min — avoid refetch on every mount
      gcTime: 1000 * 60 * 10,        // 10 min — keep in cache
      refetchOnWindowFocus: false,    // don't refetch on tab switch
      retry: 1,                       // only 1 retry on failure
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><EntitlementGate><Index /></EntitlementGate></ProtectedRoute>} />
              <Route path="/mes/:monthId" element={<ProtectedRoute><EntitlementGate><MonthDetail /></EntitlementGate></ProtectedRoute>} />
              <Route path="/calendario" element={<ProtectedRoute><EntitlementGate><CalendarioAno /></EntitlementGate></ProtectedRoute>} />
              <Route path="/calendario/:year/:month" element={<ProtectedRoute><EntitlementGate><CalendarioMes /></EntitlementGate></ProtectedRoute>} />
              <Route path="/day/:dayId" element={<ProtectedRoute><EntitlementGate><DayDetail /></EntitlementGate></ProtectedRoute>} />
              <Route path="/cuaderno" element={<ProtectedRoute><EntitlementGate><Cuaderno /></EntitlementGate></ProtectedRoute>} />
              <Route path="/ranking" element={<ProtectedRoute><EntitlementGate><Ranking /></EntitlementGate></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><EntitlementGate><Perfil /></EntitlementGate></ProtectedRoute>} />
              <Route path="/deposito" element={<ProtectedRoute><EntitlementGate><Deposito /></EntitlementGate></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><EntitlementGate><SettingsPage /></EntitlementGate></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><EntitlementGate><SupportPage /></EntitlementGate></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="/admin/months/:monthId/checklist" element={<AdminRoute><AdminMonthChecklist /></AdminRoute>} />
              <Route path="/admin/months/:monthId/days" element={<AdminRoute><AdminMonthDaysRedirect /></AdminRoute>} />

              {/* Legacy redirects */}
              <Route path="/admin/retos/:weekId/builder" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/retos/:weekId/tareas" element={<Navigate to="/admin" replace />} />
              <Route path="/reto/:weekId/dia/:dayNumber" element={<ProtectedRoute><Suspense fallback={<RouteFallback />}><ResolveLegacyDayRoute /></Suspense></ProtectedRoute>} />
              <Route path="/reto/:weekId" element={<Navigate to="/" replace />} />
              <Route path="/lecturas" element={<Navigate to="/" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
