import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";

import DashboardPage from "./pages/DashboardPage";
import ParticipantesPage from "./pages/ParticipantesPage";
import PagosPage from "./pages/PagosPage";
import AsistenciasPage from "./pages/AsistenciasPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/participantes" element={<ParticipantesPage />} />
        <Route path="/pagos" element={<PagosPage />} />
        <Route path="/asistencias" element={<AsistenciasPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}