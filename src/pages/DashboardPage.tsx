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
};

type Pago = {
  id: string;
  id_participante: string;
  monto: number | null;
  fecha_pago: string;
  mes_abonado: number;
  anio_abonado: number;
  created_at: string;
  participante: {
    id: string;
    nombre: string;
    apellido: string;
  } | null;
};

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function DashboardPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<Participante[]>([]);
  const [ultimosPagos, setUltimosPagos] = useState<Pago[]>([]);
  const [asistenciasHoy, setAsistenciasHoy] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const hoy = new Date().toISOString().slice(0, 10);
        const manana = new Date(Date.now() + 86400000)
          .toISOString()
          .slice(0, 10);

        const [
          { data: participantesData, error: participantesError },
          { data: pagosData, error: pagosError },
          { count: asistenciasCount, error: asistenciasError },
        ] = await Promise.all([
          supabase
            .from("participantes")
            .select("id,nombre,apellido,ci,estado,fecha_ingreso")
            .order("fecha_ingreso", { ascending: false }),

          supabase
            .from("pagos")
            .select(
              `
                id,
                id_participante,
                monto,
                fecha_pago,
                mes_abonado,
                anio_abonado,
                created_at,
                participante:participantes (
                  id,
                  nombre,
                  apellido
                )
              `,
            )
            .order("created_at", { ascending: false })
            .limit(6),

          supabase
            .from("asistencias")
            .select("id", { count: "exact", head: true })
            .gte("fecha", `${hoy}T00:00:00`)
            .lt("fecha", `${manana}T00:00:00`),
        ]);

        if (participantesError) throw participantesError;
        if (pagosError) throw pagosError;
        if (asistenciasError) throw asistenciasError;

        setRows((participantesData ?? []) as Participante[]);
        setUltimosPagos((pagosData ?? []) as unknown as Pago[]);
        setAsistenciasHoy(asistenciasCount ?? 0);
      } catch (error) {
        console.error("Error cargando el dashboard:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const now = new Date();

  const activas = rows.filter((participante) => {
    return participante.estado === "activa";
  });

  const nuevos = rows.filter((participante) => {
    const fechaIngreso = new Date(
      `${participante.fecha_ingreso}T00:00:00`,
    );

    return (
      fechaIngreso.getMonth() === now.getMonth() &&
      fechaIngreso.getFullYear() === now.getFullYear()
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-slate-500">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Participantes activas" value={activas.length} />
        <Stat label="Últimos pagos" value={ultimosPagos.length} />
        <Stat label="Asistencias hoy" value={asistenciasHoy} />
        <Stat label="Nuevos ingresos" value={nuevos.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Últimas participantes</h3>

            <button
              type="button"
              onClick={() => navigate("/participantes")}
              className="text-sm font-medium text-pink-600 hover:text-pink-700"
            >
              Ver todas
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {loading ? (
              <p className="text-sm text-slate-500">Cargando...</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-slate-500">
                No hay participantes registradas.
              </p>
            ) : (
              rows.slice(0, 5).map((participante) => (
                <button
                  type="button"
                  key={participante.id}
                  onClick={() =>
                    navigate(`/participantes/${participante.id}`)
                  }
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
                >
                  <div>
                    <h4 className="font-semibold">
                      {participante.nombre} {participante.apellido}
                    </h4>

                    <p className="text-sm text-slate-500">
                      CI: {participante.ci}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                    {participante.estado}
                  </span>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Últimos pagos</h3>

            <button
              type="button"
              onClick={() => navigate("/pagos")}
              className="text-sm font-medium text-pink-600 hover:text-pink-700"
            >
              Ver todos
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {loading ? (
              <p className="text-sm text-slate-500">Cargando...</p>
            ) : ultimosPagos.length === 0 ? (
              <p className="text-sm text-slate-500">
                No hay pagos registrados.
              </p>
            ) : (
              ultimosPagos.map((pago) => (
                <button
                  type="button"
                  key={pago.id}
                  onClick={() =>
                    navigate(
                      `/participantes/${pago.id_participante}?tab=pagos`,
                    )
                  }
                  className="rounded-2xl bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold">
                        {pago.participante
                          ? `${pago.participante.nombre} ${pago.participante.apellido}`
                          : "Participante"}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        {MESES[pago.mes_abonado - 1]} {pago.anio_abonado}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Pagado el{" "}
                        {new Date(
                          `${pago.fecha_pago}T00:00:00`,
                        ).toLocaleDateString("es-UY")}
                      </p>
                    </div>

                    <span className="shrink-0 font-semibold text-green-600">
                      {pago.monto !== null
                        ? `$${Number(pago.monto).toLocaleString("es-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "Sin monto"}
                    </span>
                  </div>
                </button>
              ))
            )}
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
        className={`mt-3 text-4xl font-bold ${
          danger ? "text-red-500" : "text-slate-900"
        }`}
      >
        {value}
      </h2>
    </Card>
  );
}