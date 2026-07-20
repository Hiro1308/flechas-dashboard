import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
  Wallet,
  X,
} from "lucide-react";
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
type Pago = {
  id: string;
  id_participante: string;
  fecha_pago: string;
  mes_abonado: number;
  anio_abonado: number;
  monto: number | null;
  observaciones: string | null;
  participantes: { nombre: string; apellido: string; ci: string } | null;
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
const hoy = new Date();
export default function PagosPage() {
  const navigate = useNavigate();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaPersona, setBusquedaPersona] = useState("");
  const [seleccionada, setSeleccionada] = useState<Participante | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fecha_pago: hoy.toISOString().slice(0, 10),
    mes_abonado: String(hoy.getMonth() + 1),
    anio_abonado: String(hoy.getFullYear()),
    monto: "",
    observaciones: "",
  });
  const cargar = async () => {
    setLoading(true);
    const [{ data: p, error: e1 }, { data: ps, error: e2 }] = await Promise.all(
      [
        supabase
          .from("pagos")
          .select(
            "id,id_participante,fecha_pago,mes_abonado,anio_abonado,monto,observaciones,participantes(nombre,apellido,ci)",
          )
          .order("fecha_pago", { ascending: false }),
        supabase
          .from("participantes")
          .select("id,nombre,apellido,ci,telefono")
          .eq("estado", "activa")
          .order("apellido"),
      ],
    );
    if (e1 || e2) setError(e1?.message || e2?.message || "");
    else {
      setPagos((p ?? []) as unknown as Pago[]);
      setParticipantes((ps ?? []) as unknown as Participante[]);
    }
    setLoading(false);
  };
  useEffect(() => {
    void cargar();
  }, []);
  const resultados = useMemo(() => {
    const q = busquedaPersona.trim().toLowerCase();
    return q.length < 2
      ? []
      : participantes
          .filter((p) =>
            `${p.nombre} ${p.apellido} ${p.ci} ${p.telefono ?? ""}`
              .toLowerCase()
              .includes(q),
          )
          .slice(0, 5);
  }, [busquedaPersona, participantes]);
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return !q
      ? pagos
      : pagos.filter((p) =>
          `${p.participantes?.nombre ?? ""} ${p.participantes?.apellido ?? ""} ${p.participantes?.ci ?? ""}`
            .toLowerCase()
            .includes(q),
        );
  }, [busqueda, pagos]);
  const pagosMes = pagos.filter(
    (p) =>
      p.mes_abonado === hoy.getMonth() + 1 &&
      p.anio_abonado === hoy.getFullYear(),
  );
  const pagaron = new Set(pagosMes.map((p) => p.id_participante));
  const pendientes = Math.max(0, participantes.length - pagaron.size);
  const recaudado = pagosMes.reduce((s, p) => s + Number(p.monto ?? 0), 0);
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccionada) return;
    setSaving(true);
    setError("");
    const { error } = await supabase.from("pagos").insert({
      id_participante: seleccionada.id,
      fecha_pago: form.fecha_pago,
      mes_abonado: Number(form.mes_abonado),
      anio_abonado: Number(form.anio_abonado),
      monto: form.monto ? Number(form.monto) : null,
      observaciones: form.observaciones.trim() || null,
    });
    if (error) setError(error.message);
    else {
      setShowForm(false);
      setSeleccionada(null);
      setBusquedaPersona("");
      await cargar();
    }
    setSaving(false);
  };
  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      <div
        className={`flex flex-col gap-6 transition-all ${showForm ? "-translate-x-[34%] opacity-40" : ""}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pagos</h1>
            <p className="mt-2 text-slate-500">Control de pagos mensuales</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-2xl bg-pink-600 px-5 py-3 font-semibold text-white"
          >
            <Plus className="h-5 w-5" />
            Registrar pago
          </button>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <Stat
            label="Pagos del mes"
            value={String(pagosMes.length)}
            icon={<CheckCircle2 className="text-green-600" />}
          />
          <Stat
            label="Pendientes"
            value={String(pendientes)}
            icon={<AlertCircle className="text-red-500" />}
            valueClass="text-red-500"
          />
          <Stat
            label="Recaudado"
            value={`$${recaudado.toLocaleString("es-UY")}`}
            icon={<Wallet className="text-pink-600" />}
            valueClass="text-pink-600"
          />
        </div>
        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</div>
        )}
        <Card className="p-0">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h2 className="text-xl font-bold">Historial de pagos</h2>
              <p className="text-sm text-slate-500">
                Pagos efectivamente registrados
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar participante..."
                className="bg-transparent outline-none"
              />
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                {["Participante", "CI", "Mes", "Fecha pago", "Monto"].map(
                  (x) => (
                    <th key={x} className="px-6 py-4 text-sm text-slate-600">
                      {x}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    Cargando pagos...
                  </td>
                </tr>
              ) : (
                visibles.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() =>
                      navigate(`/participantes/${p.id_participante}?tab=pagos`)
                    }
                    className="cursor-pointer border-b hover:bg-pink-50"
                  >
                    <td className="px-6 py-5 font-semibold">
                      {p.participantes?.nombre} {p.participantes?.apellido}
                    </td>
                    <td className="px-6 py-5 text-slate-600">
                      {p.participantes?.ci}
                    </td>
                    <td className="px-6 py-5">
                      {meses[p.mes_abonado - 1]} {p.anio_abonado}
                    </td>
                    <td className="px-6 py-5">
                      {new Intl.DateTimeFormat("es-UY").format(
                        new Date(`${p.fecha_pago}T00:00:00`),
                      )}
                    </td>
                    <td className="px-6 py-5 font-semibold">
                      {p.monto == null
                        ? "Sin registrar"
                        : `$${Number(p.monto).toLocaleString("es-UY")}`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
      <Drawer
        open={showForm}
        title="Registrar pago"
        onClose={() => setShowForm(false)}
      >
        <form onSubmit={guardar} className="flex flex-col gap-5">
          <Input
            label="Buscar participante"
            value={busquedaPersona}
            onChange={(v) => {
              setBusquedaPersona(v);
              setSeleccionada(null);
            }}
          />
          {!seleccionada &&
            resultados.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSeleccionada(p);
                  setBusquedaPersona(`${p.nombre} ${p.apellido}`);
                }}
                className="rounded-2xl border bg-slate-50 p-4 text-left"
              >
                <b>
                  {p.nombre} {p.apellido}
                </b>
                <p className="text-sm text-slate-500">CI: {p.ci}</p>
              </button>
            ))}
          {seleccionada && (
            <div className="rounded-2xl bg-pink-50 p-4">
              <b>
                {seleccionada.nombre} {seleccionada.apellido}
              </b>
              <p className="text-sm">CI: {seleccionada.ci}</p>
            </div>
          )}
          <div
            className={!seleccionada ? "pointer-events-none opacity-40" : ""}
          >
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha de pago"
                type="date"
                value={form.fecha_pago}
                onChange={(v) => setForm({ ...form, fecha_pago: v })}
              />
              <Input
                label="Monto"
                type="number"
                value={form.monto}
                onChange={(v) => setForm({ ...form, monto: v })}
              />
              <Select
                label="Mes abonado"
                value={form.mes_abonado}
                onChange={(v) => setForm({ ...form, mes_abonado: v })}
              >
                {meses.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </Select>
              <Input
                label="Año abonado"
                type="number"
                value={form.anio_abonado}
                onChange={(v) => setForm({ ...form, anio_abonado: v })}
              />
            </div>
            <Textarea
              label="Observaciones"
              value={form.observaciones}
              onChange={(v) => setForm({ ...form, observaciones: v })}
            />
          </div>
          <button
            disabled={!seleccionada || saving}
            className="rounded-2xl bg-pink-600 px-6 py-3 font-semibold text-white disabled:bg-slate-300"
          >
            {saving ? "Guardando..." : "Guardar pago"}
          </button>
        </form>
      </Drawer>
    </div>
  );
}
function Stat({
  label,
  value,
  icon,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <Card>
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <h2 className={`mt-3 text-4xl font-bold ${valueClass}`}>{value}</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
          {icon}
        </div>
      </div>
    </Card>
  );
}
function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`fixed right-0 top-0 z-50 h-screen w-[620px] border-l bg-white shadow-2xl transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="flex items-center justify-between border-b px-6 py-5">
        <h2 className="text-2xl font-bold">{title}</h2>
        <button onClick={onClose}>
          <X />
        </button>
      </div>
      <div className="h-[calc(100vh-81px)] overflow-y-auto p-6">{children}</div>
    </div>
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
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-2xl border bg-slate-50 px-4 py-3 outline-none focus:border-pink-400"
      />
    </label>
  );
}
function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="rounded-2xl border bg-slate-50 px-4 py-3"
      />
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-2xl border bg-slate-50 px-4 py-3"
      >
        {children}
      </select>
    </label>
  );
}
