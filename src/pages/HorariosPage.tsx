import { useState } from "react";
import { Plus, Trash2, RotateCcw, Save, Clock } from "lucide-react";

import Card from "../components/ui/Card";

type HorarioRow = {
  id: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
  observaciones: string;
  isNew?: boolean;
};

const horariosIniciales: HorarioRow[] = [
  {
    id: 1,
    diaSemana: "1",
    horaInicio: "20:00",
    horaFin: "21:30",
    activo: true,
    observaciones: "",
  },
  {
    id: 2,
    diaSemana: "2",
    horaInicio: "20:00",
    horaFin: "21:30",
    activo: true,
    observaciones: "",
  },
  {
    id: 3,
    diaSemana: "3",
    horaInicio: "20:00",
    horaFin: "21:30",
    activo: true,
    observaciones: "",
  },
  {
    id: 4,
    diaSemana: "5",
    horaInicio: "20:00",
    horaFin: "21:30",
    activo: true,
    observaciones: "",
  },
];

const diasSemana = [
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
  { value: "7", label: "Domingo" },
];

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<HorarioRow[]>(horariosIniciales);
  const [hasChanges, setHasChanges] = useState(false);

  const updateHorario = (
    id: number,
    field: keyof HorarioRow,
    value: string | boolean
  ) => {
    setHorarios((prev) =>
      prev.map((horario) =>
        horario.id === id ? { ...horario, [field]: value } : horario
      )
    );

    setHasChanges(true);
  };

  const agregarHorario = () => {
    const nuevoHorario: HorarioRow = {
      id: Date.now(),
      diaSemana: "1",
      horaInicio: "20:00",
      horaFin: "21:30",
      activo: true,
      observaciones: "",
      isNew: true,
    };

    setHorarios((prev) => [...prev, nuevoHorario]);
    setHasChanges(true);
  };

  const quitarHorario = (id: number) => {
    setHorarios((prev) => prev.filter((horario) => horario.id !== id));
    setHasChanges(true);
  };

  const resetCambios = () => {
    setHorarios(horariosIniciales);
    setHasChanges(false);
  };

  const guardarCambios = () => {
    console.log("Guardar horarios", horarios);
    setHasChanges(false);
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

        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={resetCambios}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Deshacer
            </button>
          )}

          <button
            onClick={guardarCambios}
            disabled={!hasChanges}
            className={`
              flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold text-white transition
              ${
                hasChanges
                  ? "bg-pink-600 hover:bg-pink-700"
                  : "cursor-not-allowed bg-slate-300"
              }
            `}
          >
            <Save className="h-4 w-4" />
            Guardar cambios
          </button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Planilla de horarios
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Agregá, editá o desactivá horarios desde la misma tabla.
            </p>
          </div>

          <button
            onClick={agregarHorario}
            className="flex items-center gap-2 rounded-2xl bg-pink-50 px-4 py-3 font-semibold text-pink-700 transition hover:bg-pink-100"
          >
            <Plus className="h-4 w-4" />
            Agregar fila
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-4 py-4 text-sm font-semibold text-slate-600">
                  Día
                </th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-600">
                  Inicio
                </th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-600">
                  Fin
                </th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-600">
                  Estado
                </th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-600">
                  Observaciones
                </th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-600">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody>
              {horarios.map((horario) => (
                <tr
                  key={horario.id}
                  className={`
                    border-b border-slate-100 transition hover:bg-slate-50
                    ${!horario.activo ? "bg-slate-50 opacity-60" : "bg-white"}
                  `}
                >
                  <td className="px-4 py-4">
                    <select
                      value={horario.diaSemana}
                      onChange={(e) =>
                        updateHorario(horario.id, "diaSemana", e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                    >
                      {diasSemana.map((dia) => (
                        <option key={dia.value} value={dia.value}>
                          {dia.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-4">
                    <TimeSelect
                        value={horario.horaInicio}
                        onChange={(value) =>
                            updateHorario(horario.id, "horaInicio", value)
                        }
                    />
                  </td>

                  <td className="px-4 py-4">
                    <TimeSelect
                        value={horario.horaFin}
                        onChange={(value) =>
                            updateHorario(horario.id, "horaFin", value)
                        }
                    />
                  </td>
                  

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        updateHorario(horario.id, "activo", !horario.activo)
                      }
                      className={`
                        rounded-full px-3 py-1 text-xs font-semibold transition
                        ${
                          horario.activo
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }
                      `}
                    >
                      {horario.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>

                  <td className="px-4 py-4">
                    <input
                      type="text"
                      value={horario.observaciones}
                      onChange={(e) =>
                        updateHorario(
                          horario.id,
                          "observaciones",
                          e.target.value
                        )
                      }
                      placeholder="Opcional"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                    />
                  </td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => quitarHorario(horario.id)}
                      className="rounded-xl p-2 text-red-500 transition hover:bg-red-50"
                      title="Quitar horario"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {horarios.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No hay horarios configurados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
        <h3 className="font-bold text-amber-700">Nota importante</h3>

        <p className="mt-2 text-sm text-amber-700/80">
          Más adelante, cuando esto esté conectado a Supabase, si un horario ya
          tiene asistencias asociadas conviene desactivarlo o cerrar su vigencia,
          no eliminarlo físicamente.
        </p>
      </div>
    </div>
  );
}

function TimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const horas = Array.from({ length: 24 }, (_, hour) =>
    ["00", "15", "30", "45"].map(
      (minute) => `${String(hour).padStart(2, "0")}:${minute}`
    )
  ).flat();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="
          flex w-full items-center justify-between rounded-xl border border-slate-200
          bg-white px-3 py-2 text-sm outline-none transition
          hover:border-pink-300 focus:border-pink-400 focus:ring-4 focus:ring-pink-100
        "
      >
        <span className={value ? "font-medium text-slate-900" : "text-slate-400"}>
          {value || "HH:MM"}
        </span>

        <Clock className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {horas.map((hora) => (
            <button
              key={hora}
              type="button"
              onClick={() => {
                onChange(hora);
                setOpen(false);
              }}
              className={`
                w-full rounded-xl px-3 py-2 text-left text-sm transition
                ${
                  value === hora
                    ? "bg-pink-600 font-semibold text-white"
                    : "text-slate-600 hover:bg-pink-50 hover:text-pink-700"
                }
              `}
            >
              {hora}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}