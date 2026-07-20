import { useEffect, useState } from "react";
import { Plus, Trash2, RotateCcw, Save, Clock } from "lucide-react";
import Card from "../components/ui/Card";
import { supabase } from "../services/supabase";

type HorarioRow = {
  id: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
  observaciones: string;
  isNew?: boolean;
};
const diasSemana = [
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
  { value: "7", label: "Domingo" },
];
const mapHorario = (h: any): HorarioRow => ({
  id: h.id,
  diaSemana: String(h.dia_semana),
  horaInicio: h.hora_inicio?.slice(0, 5) ?? "",
  horaFin: h.hora_fin?.slice(0, 5) ?? "",
  activo: h.activo,
  observaciones: h.observaciones ?? "",
});

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<HorarioRow[]>([]);
  const [original, setOriginal] = useState<HorarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const cargar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("horarios_clase")
      .select("*")
      .order("dia_semana")
      .order("hora_inicio");
    if (error) setError(error.message);
    else {
      const rows = (data ?? []).map(mapHorario);
      setHorarios(rows);
      setOriginal(rows);
    }
    setLoading(false);
  };
  useEffect(() => {
    void cargar();
  }, []);
  const hasChanges = JSON.stringify(horarios) !== JSON.stringify(original);
  const update = (
    id: string,
    field: keyof HorarioRow,
    value: string | boolean,
  ) =>
    setHorarios((p) =>
      p.map((h) => (h.id === id ? { ...h, [field]: value } : h)),
    );
  const agregar = () =>
    setHorarios((p) => [
      ...p,
      {
        id: crypto.randomUUID(),
        diaSemana: "1",
        horaInicio: "20:00",
        horaFin: "21:30",
        activo: true,
        observaciones: "",
        isNew: true,
      },
    ]);
  const quitar = async (h: HorarioRow) => {
    if (h.isNew) {
      setHorarios((p) => p.filter((x) => x.id !== h.id));
      return;
    }
    const { count } = await supabase
      .from("asistencias")
      .select("id", { count: "exact", head: true })
      .eq("id_horario_clase", h.id);
    if ((count ?? 0) > 0) {
      setError(
        "Ese horario tiene asistencias asociadas. Desactivalo en lugar de eliminarlo.",
      );
      return;
    }
    setHorarios((p) => p.filter((x) => x.id !== h.id));
  };
  const guardar = async () => {
    setSaving(true);
    setError("");
    const eliminados = original
      .filter((o) => !horarios.some((h) => h.id === o.id))
      .map((h) => h.id);
    if (eliminados.length) {
      const { error } = await supabase
        .from("horarios_clase")
        .delete()
        .in("id", eliminados);
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    }
    const nuevos = horarios
      .filter((h) => h.isNew)
      .map((h) => ({
        dia_semana: Number(h.diaSemana),
        hora_inicio: h.horaInicio,
        hora_fin: h.horaFin || null,
        activo: h.activo,
        observaciones: h.observaciones || null,
      }));
    if (nuevos.length) {
      const { error } = await supabase.from("horarios_clase").insert(nuevos);
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    }
    for (const h of horarios.filter((h) => !h.isNew)) {
      const { error } = await supabase
        .from("horarios_clase")
        .update({
          dia_semana: Number(h.diaSemana),
          hora_inicio: h.horaInicio,
          hora_fin: h.horaFin || null,
          activo: h.activo,
          observaciones: h.observaciones || null,
        })
        .eq("id", h.id);
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    }
    await cargar();
    setSaving(false);
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Horarios</h1>
          <p className="mt-2 text-slate-500">
            Editá directamente los días y horarios de clase
          </p>
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <button
              onClick={() => setHorarios(original)}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-600"
            >
              <RotateCcw className="h-4 w-4" />
              Deshacer
            </button>
          )}
          <button
            onClick={guardar}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 rounded-2xl bg-pink-600 px-5 py-3 font-semibold text-white disabled:bg-slate-300"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">Planilla de horarios</h2>
            <p className="mt-1 text-sm text-slate-500">
              Los horarios con asistencias asociadas deben desactivarse.
            </p>
          </div>
          <button
            onClick={agregar}
            className="flex items-center gap-2 rounded-2xl bg-pink-50 px-4 py-3 font-semibold text-pink-700"
          >
            <Plus className="h-4 w-4" />
            Agregar fila
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                {[
                  "Día",
                  "Inicio",
                  "Fin",
                  "Estado",
                  "Observaciones",
                  "Acción",
                ].map((x) => (
                  <th
                    key={x}
                    className="px-4 py-4 text-sm font-semibold text-slate-600"
                  >
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    Cargando horarios...
                  </td>
                </tr>
              ) : (
                horarios.map((h) => (
                  <tr
                    key={h.id}
                    className={`border-b ${!h.activo ? "bg-slate-50 opacity-60" : ""}`}
                  >
                    <td className="p-4">
                      <select
                        value={h.diaSemana}
                        onChange={(e) =>
                          update(h.id, "diaSemana", e.target.value)
                        }
                        className="w-full rounded-xl border p-2"
                      >
                        {diasSemana.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <TimeSelect
                        value={h.horaInicio}
                        onChange={(v) => update(h.id, "horaInicio", v)}
                      />
                    </td>
                    <td className="p-4">
                      <TimeSelect
                        value={h.horaFin}
                        onChange={(v) => update(h.id, "horaFin", v)}
                      />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => update(h.id, "activo", !h.activo)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${h.activo ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}
                      >
                        {h.activo ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="p-4">
                      <input
                        value={h.observaciones}
                        onChange={(e) =>
                          update(h.id, "observaciones", e.target.value)
                        }
                        className="w-full rounded-xl border p-2"
                        placeholder="Opcional"
                      />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => void quitar(h)}
                        className="rounded-xl p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
function TimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const horas = Array.from({ length: 24 }, (_, h) =>
    ["00", "15", "30", "45"].map((m) => `${String(h).padStart(2, "0")}:${m}`),
  ).flat();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2"
      >
        <span>{value || "HH:MM"}</span>
        <Clock className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-50 max-h-56 w-full overflow-y-auto rounded-2xl border bg-white p-2 shadow-xl">
          {horas.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => {
                onChange(x);
                setOpen(false);
              }}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${value === x ? "bg-pink-600 text-white" : "hover:bg-pink-50"}`}
            >
              {x}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
