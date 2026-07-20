import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import { supabase } from "../services/supabase";

type Participante = {
  id: string;
  nombre: string;
  apellido: string;
  ci: string;
  estado: string;
  fecha_ingreso: string;
  ultimo_pago: { mes_abonado: number; anio_abonado: number }[] | null;
};
export default function DashboardPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Participante[]>([]);
  const [asistenciasHoy, setAsistenciasHoy] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void (async () => {
      const hoy = new Date().toISOString().slice(0, 10);
      const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const [{ data }, { count }] = await Promise.all([
        supabase
          .from("participantes")
          .select(
            "id,nombre,apellido,ci,estado,fecha_ingreso,ultimo_pago:v_ultimo_pago_participante(mes_abonado,anio_abonado)",
          )
          .order("fecha_ingreso", { ascending: false }),
        supabase
          .from("asistencias")
          .select("id", { count: "exact", head: true })
          .gte("fecha", `${hoy}T00:00:00`)
          .lt("fecha", `${manana}T00:00:00`),
      ]);
      setRows((data ?? []) as Participante[]);
      setAsistenciasHoy(count ?? 0);
      setLoading(false);
    })();
  }, []);
  const now = new Date();
  const activas = rows.filter((r) => r.estado === "activa");
  const pendientes = activas.filter((r) => {
    const u = r.ultimo_pago?.[0];
    return (
      !u ||
      u.anio_abonado < now.getFullYear() ||
      (u.anio_abonado === now.getFullYear() &&
        u.mes_abonado < now.getMonth() + 1)
    );
  });
  const nuevos = rows.filter((r) => {
    const d = new Date(`${r.fecha_ingreso}T00:00:00`);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-slate-500">Resumen general del sistema</p>
      </div>
      <div className="grid grid-cols-4 gap-6">
        <Stat label="Participantes activas" value={activas.length} />
        <Stat label="Pagos pendientes" value={pendientes.length} danger />
        <Stat label="Asistencias hoy" value={asistenciasHoy} />
        <Stat label="Nuevos ingresos" value={nuevos.length} />
      </div>
      <div className="grid grid-cols-[1.2fr_0.8fr] gap-6">
        <Card>
          <div className="flex justify-between">
            <h3 className="text-xl font-bold">Últimas participantes</h3>
            <button
              onClick={() => navigate("/participantes")}
              className="text-pink-600"
            >
              Ver todas
            </button>
          </div>
          <div className="mt-6 flex flex-col gap-4">
            {loading ? (
              <p>Cargando...</p>
            ) : (
              rows.slice(0, 5).map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/participantes/${r.id}`)}
                  className="flex items-center justify-between rounded-2xl border p-4 text-left"
                >
                  <div>
                    <h4 className="font-semibold">
                      {r.nombre} {r.apellido}
                    </h4>
                    <p className="text-sm text-slate-500">CI: {r.ci}</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                    {r.estado}
                  </span>
                </button>
              ))
            )}
          </div>
        </Card>
        <Card>
          <h3 className="text-xl font-bold">Pagos pendientes</h3>
          <div className="mt-6 flex flex-col gap-4">
            {pendientes.slice(0, 6).map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/participantes/${r.id}?tab=pagos`)}
                className="rounded-2xl bg-slate-50 p-4 text-left"
              >
                <h4 className="font-semibold">
                  {r.nombre} {r.apellido}
                </h4>
                <p className="text-sm text-red-500">Sin pago del mes actual</p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
function Stat({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <h2
        className={`mt-3 text-4xl font-bold ${danger ? "text-red-500" : "text-slate-900"}`}
      >
        {value}
      </h2>
    </Card>
  );
}
