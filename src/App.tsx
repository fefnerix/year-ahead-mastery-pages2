import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import Ranking from "./pages/Ranking";
import Perfil from "./pages/Perfil";
import DayDetail from "./pages/DayDetail";
import Cuaderno from "./pages/Cuaderno";
import Deposito from "./pages/Deposito";
import Admin from "./pages/Admin";
import AdminMonthDays from "./pages/AdminMonthDays";
import MonthDetail from "./pages/MonthDetail";
import Auth from "./pages/Auth";
import CalendarioAno from "./pages/CalendarioAno";
import CalendarioMes from "./pages/CalendarioMes";
import ResolveLegacyDayRoute from "./pages/ResolveLegacyDayRoute";
import SettingsPage from "./pages/Settings";
import SupportPage from "./pages/Support";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/mes/:monthId" element={<ProtectedRoute><MonthDetail /></ProtectedRoute>} />
            <Route path="/calendario" element={<ProtectedRoute><CalendarioAno /></ProtectedRoute>} />
            <Route path="/calendario/:year/:month" element={<ProtectedRoute><CalendarioMes /></ProtectedRoute>} />
            <Route path="/day/:dayId" element={<ProtectedRoute><DayDetail /></ProtectedRoute>} />
            <Route path="/cuaderno" element={<ProtectedRoute><Cuaderno /></ProtectedRoute>} />
            <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/deposito" element={<ProtectedRoute><Deposito /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/admin/months/:monthId/days" element={<AdminRoute><AdminMonthDays /></AdminRoute>} />

            {/* Legacy redirects */}
            <Route path="/admin/retos/:weekId/builder" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/retos/:weekId/tareas" element={<Navigate to="/admin" replace />} />
            <Route path="/reto/:weekId/dia/:dayNumber" element={<ProtectedRoute><ResolveLegacyDayRoute /></ProtectedRoute>} />
            <Route path="/reto/:weekId" element={<Navigate to="/" replace />} />
            <Route path="/lecturas" element={<Navigate to="/" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
