import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Clock, Plus, Search, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import { supabase } from "../services/supabase";

type Participante = {
  id: string;
  nombre: string;
  apellido: string;
  ci: string;
  telefono: string | null;
};
type Horario = {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string | null;
  observaciones: string | null;
};
type Asistencia = {
  id: string;
  id_participante: string;
  fecha: string;
  observaciones: string | null;
  dia_semana_snapshot: number | null;
  hora_inicio_snapshot: string | null;
  hora_fin_snapshot: string | null;
  participantes: { nombre: string; apellido: string; ci: string } | null;
};
export default function AsistenciasPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Asistencia[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [show, setShow] = useState(false);
  const [q, setQ] = useState("");
  const [qp, setQp] = useState("");
  const [sel, setSel] = useState<Participante | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const now = new Date();
  const [form, setForm] = useState({
    fecha: now.toISOString().slice(0, 10),
    hora: now.toTimeString().slice(0, 5),
    id_horario_clase: "",
    observaciones: "",
  });

  const cargar = async () => {
    setLoading(true);
    const [
      { data: a, error: e1 },
      { data: p, error: e2 },
      { data: h, error: e3 },
    ] = await Promise.all([
      supabase
        .from("asistencias")
        .select(
          "id,id_participante,fecha,observaciones,dia_semana_snapshot,hora_inicio_snapshot,hora_fin_snapshot,participantes(nombre,apellido,ci)",
        )
        .order("fecha", { ascending: false }),
      supabase
        .from("participantes")
        .select("id,nombre,apellido,ci,telefono")
        .eq("estado", "activa")
        .order("apellido"),
      supabase
        .from("horarios_clase")
        .select("id,dia_semana,hora_inicio,hora_fin,observaciones")
        .eq("activo", true)
        .order("dia_semana")
        .order("hora_inicio"),
    ]);
    if (e1 || e2 || e3)
      setError(e1?.message || e2?.message || e3?.message || "");
    else {
      setItems((a ?? []) as unknown as Asistencia[]);
      setParticipantes((p ?? []) as unknown as Participante[]);
      setHorarios((h ?? []) as unknown as Horario[]);
    }
    setLoading(false);
  };
  useEffect(() => {
    void cargar();
  }, []);

  const visibles = useMemo(() => {
    const x = q.toLowerCase();
    return !x
      ? items
      : items.filter((a) =>
          `${a.participantes?.nombre ?? ""} ${a.participantes?.apellido ?? ""} ${a.participantes?.ci ?? ""}`
            .toLowerCase()
            .includes(x),
        );
  }, [q, items]);

  const resultados = useMemo(() => {
    const x = qp.toLowerCase();
    return x.length < 2
      ? []
      : participantes
          .filter((p) =>
            `${p.nombre} ${p.apellido} ${p.ci} ${p.telefono ?? ""}`
              .toLowerCase()
              .includes(x),
          )
          .slice(0, 5);
  }, [qp, participantes]);

  const hoy = items.filter(
    (a) => a.fecha.slice(0, 10) === new Date().toISOString().slice(0, 10),
  );

  const ultimo = items[0]?.fecha
    ? new Date(items[0].fecha).toLocaleTimeString("es-UY", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sel) return;
    setSaving(true);
    const h = horarios.find((x) => x.id === form.id_horario_clase);
    const fechaIso = new Date(`${form.fecha}T${form.hora}:00`).toISOString();
    const { error } = await supabase.from("asistencias").insert({
      id_participante: sel.id,
      fecha: fechaIso,
      observaciones: form.observaciones || null,
      id_horario_clase: h?.id || null,
      dia_semana_snapshot: h?.dia_semana ?? null,
      hora_inicio_snapshot: h?.hora_inicio ?? form.hora,
      hora_fin_snapshot: h?.hora_fin ?? null,
    });
    if (error) setError(error.message);
    else {
      setShow(false);
      setSel(null);
      setQp("");
      await cargar();
    }
    setSaving(false);
  };

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      <div
        className={`flex flex-col gap-6 transition-all ${show ? "-translate-x-[34%] opacity-40" : ""}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Asistencias</h1>
            <p className="mt-2 text-slate-500">
              Control de asistencia a clases y sesiones
            </p>
          </div>
          <button
            onClick={() => setShow(true)}
            className="flex items-center gap-2 rounded-2xl bg-pink-600 px-5 py-3 font-semibold text-white"
          >
            <Plus className="h-5 w-5" />
            Registrar asistencia
          </button>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <Stat
            label="Asistencias hoy"
            value={String(hoy.length)}
            icon={<CalendarCheck />}
          />
          <Stat
            label="Participantes activas"
            value={String(participantes.length)}
            icon={<Users />}
          />
          <Stat label="Último registro" value={ultimo} icon={<Clock />} />
        </div>
        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</div>
        )}
        <Card className="p-0">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <h2 className="text-xl font-bold">Historial de asistencias</h2>
            <div className="flex items-center gap-3 rounded-2xl border bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar participante..."
                className="bg-transparent outline-none"
              />
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                {[
                  "Participante",
                  "CI",
                  "Fecha",
                  "Hora",
                  "Horario",
                  "Observaciones",
                ].map((x) => (
                  <th key={x} className="px-6 py-4 text-sm text-slate-600">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    Cargando...
                  </td>
                </tr>
              ) : (
                visibles.map((a) => {
                  const d = new Date(a.fecha);
                  return (
                    <tr
                      key={a.id}
                      onClick={() =>
                        navigate(
                          `/participantes/${a.id_participante}?tab=asistencias`,
                        )
                      }
                      className="cursor-pointer border-b hover:bg-pink-50"
                    >
                      <td className="px-6 py-5 font-semibold">
                        {a.participantes?.nombre} {a.participantes?.apellido}
                      </td>
                      <td className="px-6 py-5">{a.participantes?.ci}</td>
                      <td className="px-6 py-5">
                        {d.toLocaleDateString("es-UY")}
                      </td>
                      <td className="px-6 py-5">
                        {d.toLocaleTimeString("es-UY", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-5">
                        {a.hora_inicio_snapshot?.slice(0, 5) ?? "—"}
                        {a.hora_fin_snapshot
                          ? ` - ${a.hora_fin_snapshot.slice(0, 5)}`
                          : ""}
                      </td>
                      <td className="px-6 py-5">
                        {a.observaciones || "Sin observaciones"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Card>
      </div>
      <div
        className={`fixed right-0 top-0 z-50 h-screen w-[620px] border-l bg-white shadow-2xl transition-transform ${show ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b px-6 py-5">
          <h2 className="text-2xl font-bold">Registrar asistencia</h2>
          <button onClick={() => setShow(false)}>
            <X />
          </button>
        </div>
        <form
          onSubmit={guardar}
          className="flex h-[calc(100vh-81px)] flex-col gap-4 overflow-y-auto p-6"
        >
          <Input
            label="Buscar participante"
            value={qp}
            onChange={(v) => {
              setQp(v);
              setSel(null);
            }}
          />
          {!sel &&
            resultados.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSel(p);
                  setQp(`${p.nombre} ${p.apellido}`);
                }}
                className="rounded-2xl border bg-slate-50 p-4 text-left"
              >
                <b>
                  {p.nombre} {p.apellido}
                </b>
                <p className="text-sm">CI: {p.ci}</p>
              </button>
            ))}
          {sel && (
            <div className="rounded-2xl bg-pink-50 p-4">
              <b>
                {sel.nombre} {sel.apellido}
              </b>
              <p>CI: {sel.ci}</p>
            </div>
          )}
          <div
            className={`flex flex-col gap-4 ${!sel ? "pointer-events-none opacity-40" : ""}`}
          >
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha"
                type="date"
                value={form.fecha}
                onChange={(v) => setForm({ ...form, fecha: v })}
              />
              <Input
                label="Hora"
                type="time"
                value={form.hora}
                onChange={(v) => setForm({ ...form, hora: v })}
              />
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Horario de clase</span>
              <select
                value={form.id_horario_clase}
                onChange={(e) =>
                  setForm({ ...form, id_horario_clase: e.target.value })
                }
                className="rounded-2xl border bg-slate-50 px-4 py-3"
              >
                <option value="">Sin horario asociado</option>
                {horarios.map((h) => (
                  <option key={h.id} value={h.id}>
                    Día {h.dia_semana} · {h.hora_inicio.slice(0, 5)}
                    {h.hora_fin ? ` - ${h.hora_fin.slice(0, 5)}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Observaciones</span>
              <textarea
                rows={3}
                value={form.observaciones}
                onChange={(e) =>
                  setForm({ ...form, observaciones: e.target.value })
                }
                className="rounded-2xl border bg-slate-50 px-4 py-3"
              />
            </label>
          </div>
          <button
            disabled={!sel || saving}
            className="rounded-2xl bg-pink-600 px-6 py-3 font-semibold text-white disabled:bg-slate-300"
          >
            {saving ? "Guardando..." : "Guardar asistencia"}
          </button>
        </form>
      </div>
    </div>
  );
}
function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <h2 className="mt-3 text-4xl font-bold">{value}</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
          {icon}
        </div>
      </div>
    </Card>
  );
}
function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-2xl border bg-slate-50 px-4 py-3"
      />
    </label>
  );
}
