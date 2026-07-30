import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  LoaderCircle,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
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

type SnackbarState = {
  open: boolean;
  type: "success" | "error";
  message: string;
};

type ModalState = {
  open: boolean;
  type: "error" | "confirm-delete" | "confirm-reset" | "info";
  title: string;
  message: string;
};

const SNACKBAR_INICIAL: SnackbarState = {
  open: false,
  type: "success",
  message: "",
};

const MODAL_INICIAL: ModalState = {
  open: false,
  type: "error",
  title: "",
  message: "",
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
    horaInicio: normalizarHora(horario.hora_inicio),
    horaFin: normalizarHora(horario.hora_fin),
    activo: horario.activo,
    observaciones: horario.observaciones ?? "",
  };
}

function ordenarHorarios(horarios: HorarioRow[]) {
  return [...horarios].sort((a, b) => {
    const diferenciaDia = Number(a.diaSemana) - Number(b.diaSemana);

    if (diferenciaDia !== 0) {
      return diferenciaDia;
    }

    return a.horaInicio.localeCompare(b.horaInicio, "es", {
      numeric: true,
    });
  });
}

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<HorarioRow[]>([]);

  const [original, setOriginal] = useState<HorarioRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState<SnackbarState>(SNACKBAR_INICIAL);

  const [modal, setModal] = useState<ModalState>(MODAL_INICIAL);

  const [horarioPendienteEliminar, setHorarioPendienteEliminar] =
    useState<HorarioRow | null>(null);

  useEffect(() => {
    if (!snackbar.open) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSnackbar(SNACKBAR_INICIAL);
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [snackbar.open, snackbar.message]);

  const mostrarSnackbar = (
    message: string,
    type: SnackbarState["type"] = "success",
  ) => {
    setSnackbar({
      open: true,
      type,
      message,
    });
  };

  const mostrarErrorModal = (
    message: string,
    title = "No se pudo completar la operación",
  ) => {
    setModal({
      open: true,
      type: "error",
      title,
      message,
    });
  };

  const cerrarModal = () => {
    if (saving) {
      return;
    }

    setModal(MODAL_INICIAL);
    setHorarioPendienteEliminar(null);
  };

  const cargar = async () => {
    setLoading(true);

    const { data, error: cargarError } = await supabase
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
      mostrarErrorModal(
        cargarError.message || "No fue posible cargar los horarios.",
        "No se pudieron cargar los horarios",
      );

      setHorarios([]);
      setOriginal([]);
    } else {
      const rows = (data ?? []).map((item) => mapHorario(item as HorarioDb));

      setHorarios(rows);
      setOriginal(rows);
    }

    setLoading(false);
  };

  useEffect(() => {
    void cargar();
  }, []);

  const hasChanges = useMemo(
    () => JSON.stringify(horarios) !== JSON.stringify(original),
    [horarios, original],
  );

  const update = <Key extends keyof HorarioRow>(
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

  const solicitarQuitar = async (horario: HorarioRow) => {
    if (saving) {
      return;
    }

    if (horario.isNew) {
      setHorarios((horariosActuales) =>
        horariosActuales.filter((item) => item.id !== horario.id),
      );

      return;
    }

    const { count, error: countError } = await supabase
      .from("asistencias")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("id_horario_clase", horario.id);

    if (countError) {
      mostrarErrorModal(
        countError.message ||
          "No se pudo comprobar si el horario tiene asistencias.",
      );

      return;
    }

    if ((count ?? 0) > 0) {
      setModal({
        open: true,
        type: "info",
        title: "El horario no se puede eliminar",
        message:
          "Este horario tiene asistencias asociadas. Desactivalo en lugar de eliminarlo para conservar el historial.",
      });

      return;
    }

    setHorarioPendienteEliminar(horario);

    setModal({
      open: true,
      type: "confirm-delete",
      title: "Eliminar horario",
      message:
        "¿Confirmás que querés eliminar este horario? El cambio se aplicará cuando guardes la planilla.",
    });
  };

  const confirmarEliminar = () => {
    if (!horarioPendienteEliminar || saving) {
      return;
    }

    setHorarios((horariosActuales) =>
      horariosActuales.filter(
        (item) => item.id !== horarioPendienteEliminar.id,
      ),
    );

    setHorarioPendienteEliminar(null);
    setModal(MODAL_INICIAL);
  };

  const validarHorarios = () => {
    for (const horario of horarios) {
      if (!horario.horaInicio) {
        return "Todos los horarios deben tener una hora de inicio.";
      }

      if (horario.horaFin && horario.horaFin <= horario.horaInicio) {
        return "La hora de finalización debe ser posterior a la hora de inicio.";
      }
    }

    return "";
  };

  const guardar = async () => {
    const validationError = validarHorarios();

    if (validationError) {
      mostrarSnackbar(validationError, "error");
      return;
    }

    setSaving(true);

    const eliminados = original
      .filter(
        (horarioOriginal) =>
          !horarios.some(
            (horarioActual) => horarioActual.id === horarioOriginal.id,
          ),
      )
      .map((horario) => horario.id);

    if (eliminados.length > 0) {
      const { error: deleteError } = await supabase
        .from("horarios_clase")
        .delete()
        .in("id", eliminados);

      if (deleteError) {
        mostrarErrorModal(deleteError.message);
        setSaving(false);
        return;
      }
    }

    const nuevos = horarios
      .filter((horario) => horario.isNew)
      .map((horario) => ({
        dia_semana: Number(horario.diaSemana),
        hora_inicio: horario.horaInicio,
        hora_fin: horario.horaFin || null,
        activo: horario.activo,
        observaciones: horario.observaciones.trim() || null,
      }));

    if (nuevos.length > 0) {
      const { error: insertError } = await supabase
        .from("horarios_clase")
        .insert(nuevos);

      if (insertError) {
        mostrarErrorModal(insertError.message);
        setSaving(false);
        return;
      }
    }

    const existentes = horarios.filter((horario) => !horario.isNew);

    for (const horario of existentes) {
      const originalHorario = original.find((item) => item.id === horario.id);

      if (
        originalHorario &&
        JSON.stringify(originalHorario) === JSON.stringify(horario)
      ) {
        continue;
      }

      const { error: updateError } = await supabase
        .from("horarios_clase")
        .update({
          dia_semana: Number(horario.diaSemana),
          hora_inicio: horario.horaInicio,
          hora_fin: horario.horaFin || null,
          activo: horario.activo,
          observaciones: horario.observaciones.trim() || null,
        })
        .eq("id", horario.id);

      if (updateError) {
        mostrarErrorModal(updateError.message);
        setSaving(false);
        return;
      }
    }

    await cargar();
    setSaving(false);

    mostrarSnackbar("Los horarios se guardaron correctamente.", "success");
  };

  const solicitarDeshacer = () => {
    if (!hasChanges || saving) {
      return;
    }

    setModal({
      open: true,
      type: "confirm-reset",
      title: "Descartar cambios",
      message:
        "¿Confirmás que querés deshacer todos los cambios realizados desde el último guardado?",
    });
  };

  const confirmarDeshacer = () => {
    setHorarios(original);
    setModal(MODAL_INICIAL);

    mostrarSnackbar("Los cambios sin guardar fueron descartados.", "success");
  };

  const horariosOrdenados = useMemo(
    () => ordenarHorarios(horarios),
    [horarios],
  );

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div
        className="
          flex flex-col gap-4
          sm:flex-row sm:items-center
          sm:justify-between
        "
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Horarios
          </h1>

          <p className="mt-1 text-sm text-slate-500 sm:mt-2 sm:text-base">
            Editá directamente los días y horarios de clase
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
              onClick={solicitarDeshacer}
              disabled={saving}
              className="
                flex w-full items-center justify-center
                gap-2 rounded-2xl border
                sm:w-auto
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
              flex w-full items-center justify-center
              gap-2 rounded-2xl bg-pink-600
              sm:w-auto
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
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Planilla de horarios
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Los horarios con asistencias asociadas deben desactivarse.
            </p>
          </div>

          <button
            type="button"
            onClick={agregar}
            disabled={saving}
            className="
              flex w-full items-center justify-center
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
            Agregar horario
          </button>
        </div>

        {loading ? (
          <Card className="p-4 text-sm text-slate-500">
            Cargando horarios...
          </Card>
        ) : horariosOrdenados.length === 0 ? (
          <Card className="p-4 text-center text-sm text-slate-500">
            No hay horarios registrados.
          </Card>
        ) : (
          horariosOrdenados.map((horario) => (
            <Card
              key={horario.id}
              className={`
                overflow-visible p-4
                ${horario.activo ? "bg-white" : "bg-slate-50"}
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Select
                    value={horario.diaSemana}
                    onChange={(value) => update(horario.id, "diaSemana", value)}
                    disabled={saving}
                  >
                    {diasSemana.map((dia) => (
                      <option key={dia.value} value={dia.value}>
                        {dia.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <button
                  type="button"
                  onClick={() => void solicitarQuitar(horario)}
                  disabled={saving}
                  className="
                    shrink-0 rounded-xl p-2.5
                    text-red-500 transition-colors
                    hover:bg-red-50 hover:text-red-700
                    focus:outline-none focus:ring-4
                    focus:ring-red-100
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                  aria-label="Eliminar horario"
                  title="Eliminar horario"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-500">
                    Inicio
                  </p>

                  <TimeSelect
                    value={horario.horaInicio}
                    onChange={(value) =>
                      update(horario.id, "horaInicio", value)
                    }
                    disabled={saving}
                    required
                    mobile
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-500">
                    Fin
                  </p>

                  <TimeSelect
                    value={horario.horaFin}
                    onChange={(value) => update(horario.id, "horaFin", value)}
                    disabled={saving}
                    allowEmpty
                    mobile
                  />
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-slate-500">
                  Observaciones
                </p>

                <input
                  type="text"
                  value={horario.observaciones}
                  disabled={saving}
                  onChange={(event) =>
                    update(horario.id, "observaciones", event.target.value)
                  }
                  placeholder="Opcional"
                  className="
                    w-full rounded-2xl border
                    border-slate-300 bg-[#F5F9FF]
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
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Estado
                </span>

                <button
                  type="button"
                  onClick={() => update(horario.id, "activo", !horario.activo)}
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
                          bg-green-100 text-green-700
                          hover:bg-green-200
                          focus:ring-green-100
                        `
                        : `
                          bg-slate-200 text-slate-600
                          hover:bg-slate-300
                          focus:ring-slate-100
                        `
                    }
                  `}
                >
                  {horario.activo ? "Activo" : "Inactivo"}
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="hidden md:block">
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
                Los horarios con asistencias asociadas deben desactivarse.
              </p>
            </div>

            <button
              type="button"
              onClick={agregar}
              disabled={saving}
              className="
              flex w-full items-center justify-center
              gap-2 rounded-2xl
              border border-pink-200
              md:w-auto
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
                  <TableHeader>Observaciones</TableHeader>
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
                            update(horario.id, "diaSemana", value)
                          }
                          disabled={saving}
                        >
                          {diasSemana.map((dia) => (
                            <option key={dia.value} value={dia.value}>
                              {dia.label}
                            </option>
                          ))}
                        </Select>
                      </td>

                      <td className="px-4 py-4">
                        <TimeSelect
                          value={horario.horaInicio}
                          onChange={(value) =>
                            update(horario.id, "horaInicio", value)
                          }
                          disabled={saving}
                          required
                        />
                      </td>

                      <td className="px-4 py-4">
                        <TimeSelect
                          value={horario.horaFin}
                          onChange={(value) =>
                            update(horario.id, "horaFin", value)
                          }
                          disabled={saving}
                          allowEmpty
                        />
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            update(horario.id, "activo", !horario.activo)
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
                          {horario.activo ? "Activo" : "Inactivo"}
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
                          onClick={() => void solicitarQuitar(horario)}
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

                {!loading && horariosOrdenados.length === 0 && (
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

      <ActionModal
        open={modal.open}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        loading={saving}
        onClose={cerrarModal}
        onConfirm={
          modal.type === "confirm-delete"
            ? confirmarEliminar
            : modal.type === "confirm-reset"
              ? confirmarDeshacer
              : undefined
        }
      />

      <Snackbar
        open={snackbar.open}
        type={snackbar.type}
        message={snackbar.message}
        onClose={() => setSnackbar(SNACKBAR_INICIAL)}
      />
    </div>
  );
}

function ActionModal({
  open,
  type,
  title,
  message,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  type: ModalState["type"];
  title: string;
  message: string;
  loading: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}) {
  if (!open) {
    return null;
  }

  const requiereConfirmacion =
    type === "confirm-delete" || type === "confirm-reset";

  const esPeligroso =
    type === "confirm-delete" || type === "confirm-reset" || type === "error";

  const confirmText =
    type === "confirm-delete" ? "Eliminar horario" : "Descartar cambios";

  return (
    <div
      className="
        fixed inset-0 z-[150]
        flex items-end justify-center
        bg-slate-950/45 p-3
        sm:items-center sm:p-4
        backdrop-blur-[2px]
      "
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="horarios-modal-title"
        aria-describedby="horarios-modal-message"
        className="
          max-h-[90dvh] w-full overflow-y-auto
          sm:max-w-md
          rounded-3xl border border-slate-200
          bg-white shadow-2xl
        "
      >
        <div className="p-5 sm:p-6">
          <div
            className={`
              flex h-14 w-14 items-center
              justify-center rounded-2xl
              ${
                esPeligroso
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
              }
            `}
          >
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h2
            id="horarios-modal-title"
            className="
              mt-4 text-lg font-bold
              sm:mt-5 sm:text-xl
              text-slate-900
            "
          >
            {title}
          </h2>

          <p
            id="horarios-modal-message"
            className="
              mt-2 text-sm leading-6
              text-slate-600
            "
          >
            {message}
          </p>
        </div>

        <div
          className="
            flex flex-col-reverse gap-3
            border-t border-slate-200
            bg-slate-50 px-5 py-4
            sm:px-6 sm:py-5
            sm:flex-row sm:justify-end
          "
        >
          {requiereConfirmacion && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="
                rounded-2xl border
                border-slate-300 bg-white
                px-5 py-3 font-semibold
                text-slate-700 transition
                hover:bg-slate-100
                focus:outline-none focus:ring-4
                focus:ring-slate-200
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:w-auto
              "
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={requiereConfirmacion ? onConfirm : onClose}
            disabled={loading}
            autoFocus
            className={`
              flex items-center justify-center gap-2
              rounded-2xl px-5 py-3
              font-semibold text-white
              shadow-sm transition
              focus:outline-none focus:ring-4
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
              ${
                esPeligroso
                  ? `
                    bg-red-600 hover:bg-red-700
                    focus:ring-red-200
                  `
                  : `
                    bg-blue-600 hover:bg-blue-700
                    focus:ring-blue-200
                  `
              }
            `}
          >
            {loading && <LoaderCircle className="h-5 w-5 animate-spin" />}

            {requiereConfirmacion ? confirmText : "Entendido"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Snackbar({
  open,
  type,
  message,
  onClose,
}: {
  open: boolean;
  type: SnackbarState["type"];
  message: string;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  const esError = type === "error";

  return (
    <div
      className="
        fixed bottom-3 left-3 right-3 z-[170]
        w-auto max-w-none
        sm:bottom-6 sm:left-auto sm:right-6
        sm:w-[calc(100%-3rem)] sm:max-w-sm
      "
      role="status"
      aria-live="polite"
    >
      <div
        className={`
          flex items-start gap-3
          rounded-2xl border bg-white
          px-4 py-4 shadow-2xl
          ${esError ? "border-red-200" : "border-green-200"}
        `}
      >
        <div
          className={`
            mt-0.5 flex h-9 w-9 shrink-0
            items-center justify-center
            rounded-xl
            ${
              esError
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }
          `}
        >
          {esError ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
        </div>

        <p className="flex-1 pt-1.5 text-sm font-medium text-slate-700">
          {message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="
            rounded-lg p-1.5 text-slate-400
            transition hover:bg-slate-100
            hover:text-slate-700
            focus:outline-none focus:ring-4
            focus:ring-slate-100
          "
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
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
      onChange={(event) => onChange(event.target.value)}
      className="
        w-full min-w-0
        md:min-w-[145px]
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
  mobile = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
  required?: boolean;
  mobile?: boolean;
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
      rightSection={<Clock className="h-4 w-4 text-slate-400" />}
      popoverProps={{
        position: "bottom-start",
        shadow: "lg",
        radius: "lg",
        withinPortal: true,
      }}
      styles={{
        root: {
          width: mobile ? "100%" : 170,
          minWidth: mobile ? 0 : 170,
        },

        input: {
          minHeight: 48,
          border: "1px solid #cbd5e1",
          borderRadius: 16,
          backgroundColor: "#F5F9FF",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
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
