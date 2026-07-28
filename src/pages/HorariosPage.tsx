import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Clock,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";

import Card from "../components/ui/Card";
import { supabase } from "../services/supabase";
import { TimePicker } from "@mantine/dates";

type HorarioRow = {
  id: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
  observaciones: string;
  isNew?: boolean;
};

type HorarioDb = {
  id: string;
  dia_semana: number;
  hora_inicio: string | null;
  hora_fin: string | null;
  activo: boolean;
  observaciones: string | null;
};

const diasSemana = [
  {
    value: "1",
    label: "Lunes",
  },
  {
    value: "2",
    label: "Martes",
  },
  {
    value: "3",
    label: "Miércoles",
  },
  {
    value: "4",
    label: "Jueves",
  },
  {
    value: "5",
    label: "Viernes",
  },
  {
    value: "6",
    label: "Sábado",
  },
  {
    value: "7",
    label: "Domingo",
  },
];

function normalizarHora(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

function mapHorario(horario: HorarioDb): HorarioRow {
  return {
    id: horario.id,
    diaSemana: String(horario.dia_semana),
    horaInicio: normalizarHora(
      horario.hora_inicio,
    ),
    horaFin: normalizarHora(horario.hora_fin),
    activo: horario.activo,
    observaciones: horario.observaciones ?? "",
  };
}

function ordenarHorarios(horarios: HorarioRow[]) {
  return [...horarios].sort((a, b) => {
    const diferenciaDia =
      Number(a.diaSemana) - Number(b.diaSemana);

    if (diferenciaDia !== 0) {
      return diferenciaDia;
    }

    return a.horaInicio.localeCompare(
      b.horaInicio,
      "es",
      {
        numeric: true,
      },
    );
  });
}

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<
    HorarioRow[]
  >([]);

  const [original, setOriginal] = useState<
    HorarioRow[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    setLoading(true);
    setError("");

    const { data, error: cargarError } =
      await supabase
        .from("horarios_clase")
        .select(
          `
            id,
            dia_semana,
            hora_inicio,
            hora_fin,
            activo,
            observaciones
          `,
        )
        .order("dia_semana", {
          ascending: true,
        })
        .order("hora_inicio", {
          ascending: true,
        });

    if (cargarError) {
      setError(cargarError.message);
      setHorarios([]);
      setOriginal([]);
    } else {
      const rows = (data ?? []).map((item) =>
        mapHorario(item as HorarioDb),
      );

      setHorarios(rows);
      setOriginal(rows);
    }

    setLoading(false);
  };

  useEffect(() => {
    void cargar();
  }, []);

  const hasChanges = useMemo(
    () =>
      JSON.stringify(horarios) !==
      JSON.stringify(original),
    [horarios, original],
  );

  const update = <
    Key extends keyof HorarioRow,
  >(
    id: string,
    field: Key,
    value: HorarioRow[Key],
  ) => {
    setHorarios((horariosActuales) =>
      horariosActuales.map((horario) =>
        horario.id === id
          ? {
              ...horario,
              [field]: value,
            }
          : horario,
      ),
    );
  };

  const agregar = () => {
    setError("");

    setHorarios((horariosActuales) => [
      ...horariosActuales,
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
  };

  const quitar = async (horario: HorarioRow) => {
    setError("");

    if (horario.isNew) {
      setHorarios((horariosActuales) =>
        horariosActuales.filter(
          (item) => item.id !== horario.id,
        ),
      );

      return;
    }

    const { count, error: countError } =
      await supabase
        .from("asistencias")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("id_horario_clase", horario.id);

    if (countError) {
      setError(countError.message);
      return;
    }

    if ((count ?? 0) > 0) {
      setError(
        "Ese horario tiene asistencias asociadas. Desactivalo en lugar de eliminarlo.",
      );

      return;
    }

    setHorarios((horariosActuales) =>
      horariosActuales.filter(
        (item) => item.id !== horario.id,
      ),
    );
  };

  const validarHorarios = () => {
    for (const horario of horarios) {
      if (!horario.horaInicio) {
        return "Todos los horarios deben tener una hora de inicio.";
      }

      if (
        horario.horaFin &&
        horario.horaFin <= horario.horaInicio
      ) {
        return "La hora de finalización debe ser posterior a la hora de inicio.";
      }
    }

    return "";
  };

  const guardar = async () => {
    const validationError = validarHorarios();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    const eliminados = original
      .filter(
        (horarioOriginal) =>
          !horarios.some(
            (horarioActual) =>
              horarioActual.id === horarioOriginal.id,
          ),
      )
      .map((horario) => horario.id);

    if (eliminados.length > 0) {
      const { error: deleteError } =
        await supabase
          .from("horarios_clase")
          .delete()
          .in("id", eliminados);

      if (deleteError) {
        setError(deleteError.message);
        setSaving(false);
        return;
      }
    }

    const nuevos = horarios
      .filter((horario) => horario.isNew)
      .map((horario) => ({
        dia_semana: Number(
          horario.diaSemana,
        ),
        hora_inicio: horario.horaInicio,
        hora_fin: horario.horaFin || null,
        activo: horario.activo,
        observaciones:
          horario.observaciones.trim() || null,
      }));

    if (nuevos.length > 0) {
      const { error: insertError } =
        await supabase
          .from("horarios_clase")
          .insert(nuevos);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    const existentes = horarios.filter(
      (horario) => !horario.isNew,
    );

    for (const horario of existentes) {
      const originalHorario = original.find(
        (item) => item.id === horario.id,
      );

      if (
        originalHorario &&
        JSON.stringify(originalHorario) ===
          JSON.stringify(horario)
      ) {
        continue;
      }

      const { error: updateError } =
        await supabase
          .from("horarios_clase")
          .update({
            dia_semana: Number(
              horario.diaSemana,
            ),
            hora_inicio: horario.horaInicio,
            hora_fin:
              horario.horaFin || null,
            activo: horario.activo,
            observaciones:
              horario.observaciones.trim() ||
              null,
          })
          .eq("id", horario.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    }

    await cargar();
    setSaving(false);
  };

  const deshacer = () => {
    setHorarios(original);
    setError("");
  };

  const horariosOrdenados = useMemo(
    () => ordenarHorarios(horarios),
    [horarios],
  );

  return (
    <div className="flex flex-col gap-6">
      <div
        className="
          flex flex-col gap-4
          sm:flex-row sm:items-center
          sm:justify-between
        "
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Horarios
          </h1>

          <p className="mt-2 text-slate-500">
            Editá directamente los días y horarios
            de clase
          </p>
        </div>

        <div
          className="
            flex flex-col gap-3
            sm:flex-row sm:items-center
          "
        >
          {hasChanges && (
            <button
              type="button"
              onClick={deshacer}
              disabled={saving}
              className="
                flex items-center justify-center
                gap-2 rounded-2xl border
                border-slate-300 bg-white
                px-4 py-3 font-semibold
                text-slate-700 shadow-sm
                transition-colors
                hover:bg-slate-50
                focus:outline-none focus:ring-4
                focus:ring-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <RotateCcw className="h-4 w-4" />

              Deshacer
            </button>
          )}

          <button
            type="button"
            onClick={() => void guardar()}
            disabled={!hasChanges || saving}
            className="
              flex items-center justify-center
              gap-2 rounded-2xl bg-pink-600
              px-5 py-3 font-semibold
              text-white shadow-sm
              transition-colors
              hover:bg-pink-700
              focus:outline-none focus:ring-4
              focus:ring-pink-200
              disabled:cursor-not-allowed
              disabled:bg-slate-300
              disabled:text-slate-500
              disabled:shadow-none
            "
          >
            <Save className="h-4 w-4" />

            {saving
              ? "Guardando..."
              : "Guardar cambios"}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="
            rounded-2xl border border-red-200
            bg-red-50 px-4 py-3
            text-sm font-medium text-red-700
          "
        >
          {error}
        </div>
      )}

      <Card className="overflow-visible p-0">
        <div
          className="
            flex flex-col gap-4
            rounded-t-3xl
            border-b border-slate-200
            px-6 py-5
            md:flex-row md:items-center
            md:justify-between
          "
        >
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Planilla de horarios
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Los horarios con asistencias asociadas
              deben desactivarse.
            </p>
          </div>

          <button
            type="button"
            onClick={agregar}
            disabled={saving}
            className="
              flex items-center justify-center
              gap-2 rounded-2xl
              border border-pink-200
              bg-pink-50 px-4 py-3
              font-semibold text-pink-700
              transition-colors
              hover:border-pink-300
              hover:bg-pink-100
              focus:outline-none focus:ring-4
              focus:ring-pink-100
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Plus className="h-4 w-4" />

            Agregar fila
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr
                className="
                  border-b border-slate-200
                  bg-[#F5F9FF] text-left
                "
              >
                <TableHeader>Día</TableHeader>
                <TableHeader>Inicio</TableHeader>
                <TableHeader>Fin</TableHeader>
                <TableHeader>Estado</TableHeader>
                <TableHeader>
                  Observaciones
                </TableHeader>
                <TableHeader>Acción</TableHeader>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="
                      px-6 py-12 text-center
                      text-slate-500
                    "
                  >
                    Cargando horarios...
                  </td>
                </tr>
              )}

              {!loading &&
                horariosOrdenados.map((horario) => (
                  <tr
                    key={horario.id}
                    className={`
                      border-b border-slate-100
                      transition-colors
                      ${
                        horario.activo
                          ? "bg-white hover:bg-[#FFF5F9]"
                          : "bg-slate-50"
                      }
                    `}
                  >
                    <td className="px-4 py-4">
                      <Select
                        value={horario.diaSemana}
                        onChange={(value) =>
                          update(
                            horario.id,
                            "diaSemana",
                            value,
                          )
                        }
                        disabled={saving}
                      >
                        {diasSemana.map((dia) => (
                          <option
                            key={dia.value}
                            value={dia.value}
                          >
                            {dia.label}
                          </option>
                        ))}
                      </Select>
                    </td>

                    <td className="px-4 py-4">
                      <TimeSelect
                        value={horario.horaInicio}
                        onChange={(value) =>
                          update(
                            horario.id,
                            "horaInicio",
                            value,
                          )
                        }
                        disabled={saving}
                        required
                      />
                    </td>

                    <td className="px-4 py-4">
                      <TimeSelect
                        value={horario.horaFin}
                        onChange={(value) =>
                          update(
                            horario.id,
                            "horaFin",
                            value,
                          )
                        }
                        disabled={saving}
                        allowEmpty
                      />
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            horario.id,
                            "activo",
                            !horario.activo,
                          )
                        }
                        disabled={saving}
                        className={`
                          rounded-full px-3 py-1.5
                          text-xs font-semibold
                          transition-colors
                          focus:outline-none focus:ring-4
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                          ${
                            horario.activo
                              ? `
                                bg-green-100
                                text-green-700
                                hover:bg-green-200
                                focus:ring-green-100
                              `
                              : `
                                bg-slate-200
                                text-slate-600
                                hover:bg-slate-300
                                focus:ring-slate-100
                              `
                          }
                        `}
                      >
                        {horario.activo
                          ? "Activo"
                          : "Inactivo"}
                      </button>
                    </td>

                    <td className="px-4 py-4">
                      <input
                        type="text"
                        value={horario.observaciones}
                        disabled={saving}
                        onChange={(event) =>
                          update(
                            horario.id,
                            "observaciones",
                            event.target.value,
                          )
                        }
                        placeholder="Opcional"
                        className="
                          w-full min-w-[220px]
                          rounded-2xl border
                          border-slate-300
                          bg-[#F5F9FF]
                          px-4 py-3 text-slate-900
                          shadow-sm outline-none
                          transition-colors
                          placeholder:text-slate-400
                          hover:border-slate-400
                          focus:border-pink-400
                          focus:bg-white
                          focus:ring-4
                          focus:ring-pink-100
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      />
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          void quitar(horario)
                        }
                        disabled={saving}
                        className="
                          rounded-xl p-2.5
                          text-red-500
                          transition-colors
                          hover:bg-red-50
                          hover:text-red-700
                          focus:outline-none
                          focus:ring-4
                          focus:ring-red-100
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                        aria-label="Eliminar horario"
                        title="Eliminar horario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading &&
                horariosOrdenados.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="
                        px-6 py-12 text-center
                        text-slate-500
                      "
                    >
                      No hay horarios registrados.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TableHeader({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <th
      className="
        whitespace-nowrap px-4 py-4
        text-sm font-semibold text-slate-700
      "
    >
      {children}
    </th>
  );
}

function Select({
  value,
  onChange,
  children,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) =>
        onChange(event.target.value)
      }
      className="
        w-full min-w-[145px]
        rounded-2xl border
        border-slate-300 bg-[#F5F9FF]
        px-4 py-3 text-slate-900
        shadow-sm outline-none
        transition-colors
        hover:border-slate-400
        focus:border-pink-400
        focus:bg-white
        focus:ring-4
        focus:ring-pink-100
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >
      {children}
    </select>
  );
}

function TimeSelect({
  value,
  onChange,
  disabled = false,
  allowEmpty = false,
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
  required?: boolean;
}) {
  return (
    <TimePicker
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      withDropdown
      format="24h"
      minutesStep={5}
      clearable={allowEmpty}
      size="md"
      radius="lg"
      rightSection={
        <Clock className="h-4 w-4 text-slate-400" />
      }
      popoverProps={{
        position: "bottom-start",
        shadow: "lg",
        radius: "lg",
        withinPortal: true,
      }}
      styles={{
        root: {
          width: 170,
          minWidth: 170,
        },

        input: {
          minHeight: 48,
          border: "1px solid #cbd5e1",
          borderRadius: 16,
          backgroundColor: "#F5F9FF",
          boxShadow:
            "0 1px 2px rgba(15, 23, 42, 0.05)",
        },

        fieldsRoot: {
          border: 0,
          backgroundColor: "transparent",
          boxShadow: "none",
        },

        field: {
          border: 0,
          backgroundColor: "transparent",
          boxShadow: "none",
          fontSize: 15,
          fontWeight: 600,
          color: "#0f172a",
        },

        dropdown: {
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          overflow: "hidden",
        },

        control: {
          borderRadius: 10,
        },
      }}
    />
  );
}