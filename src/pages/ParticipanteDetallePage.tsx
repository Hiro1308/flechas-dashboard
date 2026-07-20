import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Ban,
  CalendarCheck,
  FileText,
  User,
  Wallet,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Card from "../components/ui/Card";
import { supabase } from "../services/supabase";

type Tab = "datos" | "pagos" | "asistencias" | "archivos";
type Participante = {
  id: string;
  nombre: string;
  apellido: string;
  ci: string;
  telefono: string | null;
  telefono_alternativo: string | null;
  email: string | null;
  direccion: string | null;
  ocupacion: string | null;
  tipo_participante: string;
  estado: string;
  fecha_ingreso: string;
  prestador_salud: string | null;
  emergencia_movil: string | null;
  fecha_cirugia: string | null;
  tipo_cirugia: string | null;
  hta: boolean | null;
  diabetes: boolean | null;
  alergias: string | null;
  otros_antecedentes: string | null;
  desarrolla_linfedema: boolean | null;
  miembro_afectado: string | null;
  observaciones: string | null;
};
type Pago = {
  id: string;
  mes_abonado: number;
  anio_abonado: number;
  fecha_pago: string;
  monto: number | null;
  observaciones: string | null;
};
type Asistencia = {
  id: string;
  fecha: string;
  hora_inicio_snapshot: string | null;
  hora_fin_snapshot: string | null;
  observaciones: string | null;
};
type Archivo = {
  id: string;
  nombre: string;
  url: string;
  tipo: string | null;
  created_at: string;
};
const meses = [
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
const fmt = (v?: string | null, dateOnly = false) =>
  !v
    ? "Sin registrar"
    : new Intl.DateTimeFormat(
        "es-UY",
        dateOnly ? undefined : { dateStyle: "short", timeStyle: "short" },
      ).format(new Date(dateOnly ? `${v}T00:00:00` : v));
export default function ParticipanteDetallePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [sp, setSp] = useSearchParams();
  const raw = sp.get("tab");
  const tab: Tab = (
    ["datos", "pagos", "asistencias", "archivos"].includes(raw ?? "")
      ? raw
      : "datos"
  ) as Tab;
  const [p, setP] = useState<Participante | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!id) return;
    void (async () => {
      setLoading(true);
      const [
        { data: p, error: e1 },
        { data: pg, error: e2 },
        { data: a, error: e3 },
        { data: f, error: e4 },
      ] = await Promise.all([
        supabase.from("participantes").select("*").eq("id", id).single(),
        supabase
          .from("pagos")
          .select("*")
          .eq("id_participante", id)
          .order("fecha_pago", { ascending: false }),
        supabase
          .from("asistencias")
          .select("*")
          .eq("id_participante", id)
          .order("fecha", { ascending: false }),
        supabase
          .from("archivos_participante")
          .select("*")
          .eq("id_participante", id)
          .order("created_at", { ascending: false }),
      ]);
      if (e1 || e2 || e3 || e4)
        setError(
          e1?.message || e2?.message || e3?.message || e4?.message || "",
        );
      else {
        setP(p as Participante);
        setPagos((pg ?? []) as Pago[]);
        setAsistencias((a ?? []) as Asistencia[]);
        setArchivos((f ?? []) as Archivo[]);
      }
      setLoading(false);
    })();
  }, [id]);
  const darBaja = async () => {
    if (!id || !p) return;
    const nuevo = p.estado === "activa" ? "baja" : "activa";
    const { error } = await supabase
      .from("participantes")
      .update({
        estado: nuevo,
        fecha_egreso:
          nuevo === "baja" ? new Date().toISOString().slice(0, 10) : null,
      })
      .eq("id", id);
    if (error) setError(error.message);
    else setP({ ...p, estado: nuevo });
  };
  if (loading)
    return (
      <div className="p-12 text-center text-slate-500">Cargando ficha...</div>
    );
  if (!p)
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-red-700">
        {error || "No se encontró la participante."}
      </div>
    );
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between">
        <button
          onClick={() => navigate("/participantes")}
          className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <button
          onClick={() => void darBaja()}
          className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 font-semibold text-red-600"
        >
          <Ban className="h-4 w-4" />
          {p.estado === "activa" ? "Dar de baja" : "Reactivar"}
        </button>
      </div>
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</div>
      )}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-pink-100">
              <User className="h-10 w-10 text-pink-600" />
            </div>
            <div>
              <div className="flex gap-3">
                <h1 className="text-3xl font-bold">
                  {p.nombre} {p.apellido}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${p.estado === "activa" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}
                >
                  {p.estado}
                </span>
              </div>
              <p className="mt-2 text-slate-500">
                CI: {p.ci} · {p.tipo_participante}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Mini
              label="Último pago"
              value={
                pagos[0] ? fmt(pagos[0].fecha_pago, true) : "Sin registrar"
              }
            />
            <Mini
              label="Última asistencia"
              value={
                asistencias[0] ? fmt(asistencias[0].fecha) : "Sin registrar"
              }
            />
            <Mini label="Ingreso" value={fmt(p.fecha_ingreso, true)} />
          </div>
        </div>
      </Card>
      <Card className="p-2">
        <div className="flex gap-2">
          {(
            [
              ["datos", "Datos", <User className="h-4 w-4" />],
              ["pagos", "Pagos", <Wallet className="h-4 w-4" />],
              [
                "asistencias",
                "Asistencias",
                <CalendarCheck className="h-4 w-4" />,
              ],
              ["archivos", "Archivos", <FileText className="h-4 w-4" />],
            ] as [Tab, string, React.ReactNode][]
          ).map(([key, label, icon]) => (
            <button
              key={key}
              onClick={() => setSp({ tab: key })}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold ${tab === key ? "bg-pink-100 text-pink-700" : "text-slate-500"}`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </Card>
      {tab === "datos" && (
        <div className="grid grid-cols-2 gap-6">
          <InfoCard
            title="Datos personales"
            items={[
              ["Nombre", p.nombre],
              ["Apellido", p.apellido],
              ["Cédula", p.ci],
              ["Teléfono", p.telefono],
              ["Teléfono alternativo", p.telefono_alternativo],
              ["Email", p.email],
              ["Dirección", p.direccion],
              ["Ocupación", p.ocupacion],
            ]}
          />
          <InfoCard
            title="Datos administrativos"
            items={[
              ["Tipo", p.tipo_participante],
              ["Estado", p.estado],
              ["Fecha de ingreso", fmt(p.fecha_ingreso, true)],
            ]}
          />
          <InfoCard
            title="Información de salud"
            items={[
              ["Prestador", p.prestador_salud],
              ["Emergencia móvil", p.emergencia_movil],
              ["Fecha cirugía", fmt(p.fecha_cirugia, true)],
              ["Tipo cirugía", p.tipo_cirugia],
            ]}
          />
          <InfoCard
            title="Antecedentes y valoración"
            items={[
              ["HTA", p.hta ? "Sí" : "No"],
              ["Diabetes", p.diabetes ? "Sí" : "No"],
              ["Alergias", p.alergias],
              ["Otros antecedentes", p.otros_antecedentes],
              [
                "Desarrolla linfedema",
                p.desarrolla_linfedema == null
                  ? "Sin registrar"
                  : p.desarrolla_linfedema
                    ? "Sí"
                    : "No",
              ],
              ["Miembro afectado", p.miembro_afectado],
              ["Observaciones", p.observaciones],
            ]}
          />
        </div>
      )}
      {tab === "pagos" && (
        <Table
          headers={["Mes", "Fecha pago", "Monto", "Observaciones"]}
          rows={pagos.map((x) => [
            `${meses[x.mes_abonado - 1]} ${x.anio_abonado}`,
            fmt(x.fecha_pago, true),
            x.monto == null
              ? "Sin registrar"
              : `$${Number(x.monto).toLocaleString("es-UY")}`,
            x.observaciones || "Sin observaciones",
          ])}
        />
      )}{" "}
      {tab === "asistencias" && (
        <Table
          headers={["Fecha", "Horario", "Observaciones"]}
          rows={asistencias.map((x) => [
            fmt(x.fecha),
            `${x.hora_inicio_snapshot?.slice(0, 5) ?? "—"}${x.hora_fin_snapshot ? ` - ${x.hora_fin_snapshot.slice(0, 5)}` : ""}`,
            x.observaciones || "Sin observaciones",
          ])}
        />
      )}{" "}
      {tab === "archivos" && (
        <Card>
          <div className="grid grid-cols-3 gap-4">
            {archivos.map((x) => (
              <a
                key={x.id}
                href={x.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-3xl border bg-slate-50 p-5"
              >
                <FileText className="mb-4 text-pink-600" />
                <h3 className="font-bold">{x.nombre}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {x.tipo || "Archivo"} · {fmt(x.created_at)}
                </p>
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
function InfoCard({
  title,
  items,
}: {
  title: string;
  items: [string, string | null][];
}) {
  return (
    <Card>
      <h2 className="mb-5 text-xl font-bold">{title}</h2>
      <div className="grid gap-4">
        {items.map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase text-slate-400">{l}</p>
            <p className="mt-1 font-medium">{v || "Sin registrar"}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <Card className="p-0">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-slate-50 text-left">
            {headers.map((h) => (
              <th key={h} className="px-6 py-4 text-sm text-slate-600">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b">
              {r.map((c, j) => (
                <td key={j} className="px-6 py-5">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
