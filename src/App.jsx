import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import AsistenciasPage from "./pages/AsistenciasPage";
import DashboardPage from "./pages/DashboardPage";
import HorariosPage from "./pages/HorariosPage";
import LoginPage from "./pages/LoginPage";
import PagosPage from "./pages/PagosPage";
import ParticipanteDetallePage from "./pages/ParticipanteDetallePage";
import ParticipantesPage from "./pages/ParticipantesPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/participantes" element={<ParticipantesPage />} />
            <Route
              path="/participantes/:id"
              element={<ParticipanteDetallePage />}
            />
            <Route path="/pagos" element={<PagosPage />} />
            <Route path="/asistencias" element={<AsistenciasPage />} />
            <Route path="/horarios" element={<HorariosPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
