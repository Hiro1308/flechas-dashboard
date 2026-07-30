import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  LoaderCircle,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import { supabase } from "../services/supabase";

import FormatHelper from "../helpers/FormatHelper";

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
  participantes: {
    nombre: string;
    apellido: string;
    ci: string;
    foto_perfil_path: string | null;
  } | null;
};

type AsistenciaForm = {
  fecha: string;
  hora: string;
  id_horario_clase: string;
  observaciones: string;
};

type SnackbarState = {
  open: boolean;
  type: "success" | "error";
  message: string;
};

type ErrorModalState = {
  open: boolean;
  title: string;
  message: string;
};

const SNACKBAR_INICIAL: SnackbarState = {
  open: false,
  type: "success",
  message: "",
};

const ERROR_MODAL_INICIAL: ErrorModalState = {
  open: false,
  title: "",
  message: "",
};

const FOTO_BUCKET = "fotos-participantes";

const PLACEHOLDER_FOTO = "/placeholder_person.png";

const diasSemana: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

function obtenerFechaLocal() {
  const fecha = new Date();

  const diferenciaZonaHoraria = fecha.getTimezoneOffset() * 60_000;

  return new Date(fecha.getTime() - diferenciaZonaHoraria)
    .toISOString()
    .slice(0, 10);
}

function obtenerHoraLocal() {
  const fecha = new Date();

  return `${String(fecha.getHours()).padStart(2, "0")}:${String(
    fecha.getMinutes(),
  ).padStart(2, "0")}`;
}

function crearFormularioInicial(): AsistenciaForm {
  return {
    fecha: obtenerFechaLocal(),
    hora: obtenerHoraLocal(),
    id_horario_clase: "",
    observaciones: "",
  };
}

function formatearFecha(value: string) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatearHora(value: string | Date) {
  const fecha = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).format(fecha);
}

function normalizarHora(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

function formatearRangoHorario(inicio?: string | null, fin?: string | null) {
  const horaInicio = normalizarHora(inicio);

  if (!horaInicio) {
    return "Sin horario";
  }

  const horaFin = normalizarHora(fin);

  return horaFin ? `${horaInicio} - ${horaFin}` : horaInicio;
}

export default function AsistenciasPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<Asistencia[]>([]);

  const [participantes, setParticipantes] = useState<Participante[]>([]);

  const [horarios, setHorarios] = useState<Horario[]>([]);

  const [showForm, setShowForm] = useState(false);

  const [busqueda, setBusqueda] = useState("");

  const [busquedaParticipante, setBusquedaParticipante] = useState("");

  const [seleccionada, setSeleccionada] = useState<Participante | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState<SnackbarState>(SNACKBAR_INICIAL);

  const [errorModal, setErrorModal] =
    useState<ErrorModalState>(ERROR_MODAL_INICIAL);

  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const [form, setForm] = useState<AsistenciaForm>(crearFormularioInicial);

  const mostrarSnackbar = (
    message: string,
    type: "success" | "error" = "success",
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
    setErrorModal({
      open: true,
      title,
      message,
    });
  };

  const cargar = async () => {
    setLoading(true);
    setErrorModal(ERROR_MODAL_INICIAL);

    const [
      { data: asistenciasData, error: asistenciasError },
      { data: participantesData, error: participantesError },
      { data: horariosData, error: horariosError },
    ] = await Promise.all([
      supabase
        .from("asistencias")
        .select(
          `
            id,
            id_participante,
            fecha,
            observaciones,
            dia_semana_snapshot,
            hora_inicio_snapshot,
            hora_fin_snapshot,
            participantes (
              nombre,
              apellido,
              ci,
              foto_perfil_path
            )
          `,
        )
        .order("fecha", {
          ascending: false,
        }),

      supabase
        .from("participantes")
        .select(
          `
            id,
            nombre,
            apellido,
            ci,
            telefono
          `,
        )
        .eq("estado", "activa")
        .order("apellido", {
          ascending: true,
        })
        .order("nombre", {
          ascending: true,
        }),

      supabase
        .from("horarios_clase")
        .select(
          `
            id,
            dia_semana,
            hora_inicio,
            hora_fin,
            observaciones
          `,
        )
        .eq("activo", true)
        .order("dia_semana", {
          ascending: true,
        })
        .order("hora_inicio", {
          ascending: true,
        }),
    ]);

    if (asistenciasError || participantesError || horariosError) {
      mostrarErrorModal(
        asistenciasError?.message ||
          participantesError?.message ||
          horariosError?.message ||
          "No fue posible cargar las asistencias.",
        "No se pudieron cargar las asistencias",
      );

      setItems([]);
      setParticipantes([]);
      setHorarios([]);
    } else {
      setItems((asistenciasData ?? []) as unknown as Asistencia[]);

      setParticipantes((participantesData ?? []) as unknown as Participante[]);

      setHorarios((horariosData ?? []) as unknown as Horario[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    void cargar();
  }, []);

  const asistenciasVisibles = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    if (!textoBusqueda) {
      return items;
    }

    return items.filter((asistencia) => {
      const coincideTexto = [
        asistencia.participantes?.nombre ?? "",
        asistencia.participantes?.apellido ?? "",
        asistencia.observaciones ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(textoBusqueda);

      const coincideCedula = FormatHelper.cedulaIncluyeBusqueda(
        asistencia.participantes?.ci,
        busqueda,
      );

      return coincideTexto || coincideCedula;
    });
  }, [busqueda, items]);

  const participantesEncontradas = useMemo(() => {
    const textoBusqueda = busquedaParticipante.trim().toLowerCase();

    if (textoBusqueda.length < 2) {
      return [];
    }

    return participantes
      .filter((participante) => {
        const coincideTexto = [
          participante.nombre,
          participante.apellido,
          participante.telefono ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(textoBusqueda);

        const coincideCedula = FormatHelper.cedulaIncluyeBusqueda(
          participante.ci,
          busquedaParticipante,
        );

        return coincideTexto || coincideCedula;
      })
      .slice(0, 6);
  }, [busquedaParticipante, participantes]);

  const estadisticas = useMemo(() => {
    const fechaHoy = obtenerFechaLocal();

    const asistenciasHoy = items.filter(
      (asistencia) => asistencia.fecha.slice(0, 10) === fechaHoy,
    );

    const ultimoRegistro = items[0]?.fecha
      ? formatearHora(items[0].fecha)
      : "—";

    return {
      asistenciasHoy: asistenciasHoy.length,
      participantesActivas: participantes.length,
      ultimoRegistro,
    };
  }, [items, participantes]);

  const abrirFormulario = () => {
    setSeleccionada(null);
    setBusquedaParticipante("");
    setForm(crearFormularioInicial());
    setShowForm(true);
  };

  const formularioTieneCambios =
    Boolean(seleccionada) ||
    busquedaParticipante.trim() !== "" ||
    JSON.stringify(form) !== JSON.stringify(crearFormularioInicial());

  const cerrarFormulario = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setSeleccionada(null);
    setBusquedaParticipante("");
    setForm(crearFormularioInicial());
    setConfirmCloseOpen(false);
  };

  const solicitarCerrarFormulario = () => {
    if (saving) {
      return;
    }

    if (formularioTieneCambios) {
      setConfirmCloseOpen(true);
      return;
    }

    cerrarFormulario();
  };

  const seleccionarParticipante = (participante: Participante) => {
    setSeleccionada(participante);

    setBusquedaParticipante(`${participante.nombre} ${participante.apellido}`);
  };

  const seleccionarHorario = (horarioId: string) => {
    const horario = horarios.find((item) => item.id === horarioId);

    setForm((formActual) => ({
      ...formActual,
      id_horario_clase: horarioId,
      hora: horario ? normalizarHora(horario.hora_inicio) : formActual.hora,
    }));
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!seleccionada) {
      mostrarSnackbar("Seleccioná una participante antes de guardar.", "error");

      return;
    }

    setSaving(true);

    const horario = horarios.find((item) => item.id === form.id_horario_clase);

    const fechaLocal = new Date(`${form.fecha}T${form.hora}:00`);

    const { error } = await supabase.from("asistencias").insert({
      id_participante: seleccionada.id,

      fecha: fechaLocal.toISOString(),

      observaciones: form.observaciones.trim() || null,

      id_horario_clase: horario?.id ?? null,

      dia_semana_snapshot: horario?.dia_semana ?? null,

      hora_inicio_snapshot: horario?.hora_inicio ?? `${form.hora}:00`,

      hora_fin_snapshot: horario?.hora_fin ?? null,
    });

    if (error) {
      mostrarErrorModal(
        error.message || "No se pudo registrar la asistencia.",
        "No se pudo guardar la asistencia",
      );
      setSaving(false);

      return;
    }

    setShowForm(false);
    setSeleccionada(null);
    setBusquedaParticipante("");
    setForm(crearFormularioInicial());

    await cargar();

    setSaving(false);
    mostrarSnackbar("La asistencia se registró correctamente.", "success");
  };

  return (
    <div className="relative flex flex-col gap-5 sm:gap-6">
      <div
        className={`
          flex flex-col gap-6
          transition-opacity duration-300
          ${showForm ? "pointer-events-none opacity-40" : "opacity-100"}
        `}
      >
        <div
          className="
            flex flex-col gap-4
            sm:flex-row sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Asistencias
            </h1>

            <p className="mt-1 text-sm text-slate-500 sm:mt-2 sm:text-base">
              Control de asistencia a clases y sesiones
            </p>
          </div>

          <button
            type="button"
            onClick={abrirFormulario}
            className="
              flex w-full items-center
              justify-center gap-2
              rounded-2xl bg-pink-600
              px-5 py-3 font-semibold
              text-white shadow-sm
              transition-colors
              hover:bg-pink-700
              focus:outline-none
              focus:ring-4
              focus:ring-pink-200
              sm:w-auto
            "
          >
            <Plus className="h-5 w-5" />
            Registrar asistencia
          </button>
        </div>

        <div
          className="
            grid grid-cols-2 gap-3
            md:grid-cols-3 md:gap-6
          "
        >
          <Stat
            label="Asistencias hoy"
            value={String(estadisticas.asistenciasHoy)}
            icon={<CalendarCheck className="h-6 w-6 text-green-600" />}
            iconBackground="bg-green-50"
          />

          <Stat
            label="Participantes activas"
            value={String(estadisticas.participantesActivas)}
            icon={<Users className="h-6 w-6 text-pink-600" />}
            iconBackground="bg-pink-50"
          />

          <Stat
            label="Último registro"
            value={estadisticas.ultimoRegistro}
            icon={<Clock className="h-6 w-6 text-slate-600" />}
            iconBackground="bg-slate-100"
            valueClass="text-3xl text-slate-900"
          />
        </div>

        <div className="flex flex-col gap-3 md:hidden">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Historial de asistencias
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Asistencias efectivamente registradas
              </p>
            </div>

            <div
              className="
                flex items-center gap-3
                rounded-2xl border
                border-slate-300
                bg-[#F5F9FF]
                px-4 py-3 shadow-sm
                transition-colors
                focus-within:border-pink-400
                focus-within:bg-white
                focus-within:ring-4
                focus-within:ring-pink-100
              "
            >
              <Search className="h-4 w-4 shrink-0 text-slate-500" />

              <input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar participante..."
                className="
                  w-full min-w-0 bg-transparent
                  text-sm text-slate-900 outline-none
                  placeholder:text-slate-400
                "
              />
            </div>
          </div>

          {loading ? (
            <Card className="p-4 text-sm text-slate-500">
              Cargando asistencias...
            </Card>
          ) : asistenciasVisibles.length === 0 ? (
            <Card className="p-4 text-center text-sm text-slate-500">
              No se encontraron asistencias.
            </Card>
          ) : (
            asistenciasVisibles.map((asistencia) => (
              <button
                type="button"
                key={asistencia.id}
                onClick={() =>
                  navigate(
                    `/participantes/${asistencia.id_participante}?tab=asistencias`,
                  )
                }
                className="
                  w-full rounded-3xl border
                  border-slate-200 bg-white
                  p-4 text-left shadow-sm
                  transition-colors
                  hover:bg-[#FFF5F9]
                  focus:outline-none
                  focus:ring-4
                  focus:ring-pink-100
                "
              >
                <div className="flex items-start gap-3">
                  <FotoParticipante
                    path={asistencia.participantes?.foto_perfil_path ?? null}
                    nombre={
                      asistencia.participantes
                        ? `${asistencia.participantes.nombre} ${asistencia.participantes.apellido}`
                        : "Participante"
                    }
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {asistencia.participantes?.nombre ?? "Sin datos"}{" "}
                          {asistencia.participantes?.apellido ?? ""}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          CI:{" "}
                          {FormatHelper.mostrarCedula(
                            asistencia.participantes?.ci,
                          )}
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-bold text-pink-600">
                        {formatearHora(asistencia.fecha)}
                      </span>
                    </div>

                    <div
                      className="
                        mt-3 grid grid-cols-2 gap-2
                        rounded-2xl bg-[#F5F9FF] p-3
                      "
                    >
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Fecha
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatearFecha(asistencia.fecha)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Horario
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatearRangoHorario(
                            asistencia.hora_inicio_snapshot,
                            asistencia.hora_fin_snapshot,
                          )}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                      {asistencia.observaciones || "Sin observaciones"}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="hidden md:block">
          <Card className="overflow-hidden p-0">
            <div
              className="
              flex flex-col gap-4
              border-b border-slate-200
              px-6 py-5
              md:flex-row md:items-center
              md:justify-between
            "
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Historial de asistencias
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Asistencias efectivamente registradas
                </p>
              </div>

              <div
                className="
                flex items-center gap-3
                rounded-2xl border
                border-slate-300
                bg-[#F5F9FF]
                px-4 py-3 shadow-sm
                transition-colors
                focus-within:border-pink-400
                focus-within:bg-white
                focus-within:ring-4
                focus-within:ring-pink-100
              "
              >
                <Search className="h-4 w-4 shrink-0 text-slate-500" />

                <input
                  type="search"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar participante..."
                  className="
                  w-full min-w-0
                  bg-transparent text-sm
                  text-slate-900
                  outline-none
                  placeholder:text-slate-400
                  md:w-72
                "
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr
                    className="
                    border-b
                    border-slate-200
                    bg-[#F5F9FF]
                    text-left
                  "
                  >
                    <th
                      aria-label="Foto de perfil"
                      className="
                      w-[88px]
                      px-4 py-4
                    "
                    />

                    <TableHeader>Participante</TableHeader>

                    <TableHeader>CI</TableHeader>

                    <TableHeader>Fecha</TableHeader>

                    <TableHeader>Hora</TableHeader>

                    <TableHeader>Horario</TableHeader>

                    <TableHeader>Observaciones</TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="
                        px-6 py-12
                        text-center
                        text-slate-500
                      "
                      >
                        Cargando asistencias...
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    asistenciasVisibles.map((asistencia) => (
                      <tr
                        key={asistencia.id}
                        onClick={() =>
                          navigate(
                            `/participantes/${asistencia.id_participante}?tab=asistencias`,
                          )
                        }
                        className="
                          cursor-pointer
                          border-b
                          border-slate-100
                          transition-colors
                          hover:bg-[#FFF5F9]
                        "
                      >
                        <td
                          className="
                            w-[88px]
                            px-4 py-3
                          "
                        >
                          <FotoParticipante
                            path={
                              asistencia.participantes?.foto_perfil_path ?? null
                            }
                            nombre={
                              asistencia.participantes
                                ? `${asistencia.participantes.nombre} ${asistencia.participantes.apellido}`
                                : "Participante"
                            }
                          />
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                            font-semibold
                            text-slate-900
                          "
                        >
                          {asistencia.participantes?.nombre ?? "Sin datos"}{" "}
                          {asistencia.participantes?.apellido ?? ""}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                            text-slate-600
                          "
                        >
                          {FormatHelper.mostrarCedula(
                            asistencia.participantes?.ci,
                          )}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                            text-slate-600
                          "
                        >
                          {formatearFecha(asistencia.fecha)}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                            font-semibold
                            text-slate-900
                          "
                        >
                          {formatearHora(asistencia.fecha)}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                            text-slate-600
                          "
                        >
                          {formatearRangoHorario(
                            asistencia.hora_inicio_snapshot,
                            asistencia.hora_fin_snapshot,
                          )}
                        </td>

                        <td
                          className="
                            max-w-xs px-6 py-5
                            text-slate-600
                          "
                        >
                          <span className="line-clamp-2">
                            {asistencia.observaciones || "Sin observaciones"}
                          </span>
                        </td>
                      </tr>
                    ))}

                  {!loading && asistenciasVisibles.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="
                          px-6 py-12
                          text-center
                          text-slate-500
                        "
                      >
                        No se encontraron asistencias.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <RegistrarAsistenciaPanel
        open={showForm}
        form={form}
        seleccionada={seleccionada}
        busquedaParticipante={busquedaParticipante}
        participantesEncontradas={participantesEncontradas}
        horarios={horarios}
        saving={saving}
        onBusquedaChange={(value) => {
          setBusquedaParticipante(value);
          setSeleccionada(null);
        }}
        onSelectParticipante={seleccionarParticipante}
        onSelectHorario={seleccionarHorario}
        onFormChange={setForm}
        onClose={solicitarCerrarFormulario}
        onSubmit={guardar}
        error={""}
      />

      <ConfirmationModal
        open={confirmCloseOpen}
        title="Descartar cambios"
        message="Hay datos cargados que todavía no fueron guardados. Si cerrás el formulario, vas a perderlos."
        confirmText="Descartar cambios"
        loading={saving}
        onCancel={() => setConfirmCloseOpen(false)}
        onConfirm={cerrarFormulario}
      />

      <ErrorModal
        open={errorModal.open}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal(ERROR_MODAL_INICIAL)}
        onRetry={() => void cargar()}
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

function FotoParticipante({
  path,
  nombre,
}: {
  path: string | null;
  nombre: string;
}) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [path]);

  const fotoUrl = useMemo(() => {
    if (!path) {
      return null;
    }

    const { data } = supabase.storage.from(FOTO_BUCKET).getPublicUrl(path);

    return data.publicUrl;
  }, [path]);

  const src = fotoUrl && !imageError ? fotoUrl : PLACEHOLDER_FOTO;

  return (
    <div
      className="
        h-12 w-12 shrink-0
        overflow-hidden rounded-full
        border-2 border-white
        bg-pink-50 shadow-sm
        ring-1 ring-slate-200
      "
    >
      <img
        src={src}
        alt={`Foto de ${nombre}`}
        loading="lazy"
        onError={() => {
          if (src !== PLACEHOLDER_FOTO) {
            setImageError(true);
          }
        }}
        className="
          h-full w-full
          object-cover
        "
      />
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  iconBackground,
  valueClass = "text-4xl text-slate-900",
}: {
  label: string;
  value: string;
  icon: ReactNode;
  iconBackground: string;
  valueClass?: string;
}) {
  return (
    <Card className="min-w-0 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div>
          <p className="text-xs font-medium leading-5 text-slate-500 sm:text-sm">
            {label}
          </p>

          <h2
            className={`
              mt-2 text-2xl font-bold
              sm:mt-3 sm:text-4xl
              ${valueClass}
            `}
          >
            {value}
          </h2>
        </div>

        <div
          className={`
            flex h-10 w-10
            sm:h-12 sm:w-12
            shrink-0 items-center
            justify-center
            rounded-2xl
            ${iconBackground}
          `}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th
      className="
        whitespace-nowrap
        px-6 py-4 text-sm
        font-semibold text-slate-700
      "
    >
      {children}
    </th>
  );
}

function RegistrarAsistenciaPanel({
  open,
  form,
  seleccionada,
  busquedaParticipante,
  participantesEncontradas,
  horarios,
  saving,
  onBusquedaChange,
  onSelectParticipante,
  onSelectHorario,
  onFormChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  form: AsistenciaForm;
  seleccionada: Participante | null;
  busquedaParticipante: string;
  participantesEncontradas: Participante[];
  horarios: Horario[];
  saving: boolean;
  error: string;
  onBusquedaChange: (value: string) => void;
  onSelectParticipante: (participante: Participante) => void;
  onSelectHorario: (horarioId: string) => void;
  onFormChange: (form: AsistenciaForm) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const formularioHabilitado = Boolean(seleccionada);

  return (
    <>
      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-40
          bg-slate-950/20
          backdrop-blur-[1px]
          transition-opacity
          duration-300
          ${
            open
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
        aria-hidden="true"
      />

      <aside
        className={`
          fixed right-0 top-0 z-50
          h-dvh w-full
          max-w-none
          overflow-hidden
          sm:max-w-[760px]
          border-l border-slate-200
          bg-[#FFF5F9]
          shadow-2xl
          transform-gpu
          will-change-transform
          transition-transform
          duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col">
          <header
            className="
              flex shrink-0
              items-center
              justify-between gap-4
              border-b
              border-slate-200
              bg-white px-4 py-4
              sm:px-6 sm:py-5
            "
          >
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div
                className="
                  flex h-10 w-10
                  sm:h-12 sm:w-12
                  shrink-0 items-center
                  justify-center
                  rounded-2xl
                  bg-pink-100
                  text-pink-700
                "
              >
                <CalendarCheck className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Registrar asistencia
                </h2>

                <p className="mt-1 hidden text-sm text-slate-500 sm:block">
                  Seleccioná una participante y completá los datos.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                rounded-full p-2
                text-slate-500
                transition-colors
                hover:bg-slate-100
                hover:text-slate-900
                focus:outline-none
                focus:ring-4
                focus:ring-pink-100
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              aria-label="Cerrar formulario"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <form
            onSubmit={onSubmit}
            className="
              flex min-h-0 flex-1
              flex-col overflow-hidden
            "
          >
            <div
              className="
                flex-1
                overflow-y-auto
                overscroll-contain
                px-4 py-4
                sm:px-6 sm:py-6
              "
            >
              <Section
                title="Participante"
                description="Buscá por nombre, cédula o teléfono."
                icon={<UserRound className="h-5 w-5" />}
              >
                <Input
                  required
                  label="Buscar participante"
                  value={busquedaParticipante}
                  onChange={onBusquedaChange}
                  placeholder="Ingresá al menos 2 caracteres"
                />

                {!seleccionada &&
                  busquedaParticipante.trim().length >= 2 &&
                  participantesEncontradas.length === 0 && (
                    <div
                      className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-[#F5F9FF]
                        px-4 py-4
                        text-sm
                        text-slate-500
                      "
                    >
                      No se encontraron participantes.
                    </div>
                  )}

                {!seleccionada && participantesEncontradas.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {participantesEncontradas.map((participante) => (
                      <button
                        key={participante.id}
                        type="button"
                        onClick={() => onSelectParticipante(participante)}
                        className="
                              rounded-2xl
                              border
                              border-slate-200
                              bg-[#F5F9FF]
                              p-4 text-left
                              shadow-sm
                              transition-colors
                              hover:border-pink-300
                              hover:bg-white
                              focus:outline-none
                              focus:ring-4
                              focus:ring-pink-100
                            "
                      >
                        <p className="font-semibold text-slate-900">
                          {participante.nombre} {participante.apellido}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          CI: {FormatHelper.mostrarCedula(participante.ci)}
                        </p>

                        {participante.telefono && (
                          <p className="mt-1 text-sm text-slate-500">
                            Teléfono: {participante.telefono}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {seleccionada && (
                  <div
                    className="
                      flex items-center
                      justify-between gap-4
                      rounded-2xl
                      border
                      border-pink-200
                      bg-pink-50
                      px-4 py-4
                    "
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {seleccionada.nombre} {seleccionada.apellido}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        CI: {FormatHelper.mostrarCedula(seleccionada.ci)}
                      </p>
                    </div>

                    <CheckCircle2 className="h-5 w-5 shrink-0 text-pink-600" />
                  </div>
                )}
              </Section>

              <div
                className={
                  formularioHabilitado
                    ? ""
                    : `
                      pointer-events-none
                      select-none
                      opacity-40
                    `
                }
                aria-disabled={!formularioHabilitado}
              >
                <Section
                  title="Datos de la asistencia"
                  description="Fecha, hora y horario asociado."
                  icon={<Clock className="h-5 w-5" />}
                >
                  <div
                    className="
                      grid grid-cols-1
                      gap-4
                      sm:grid-cols-2
                    "
                  >
                    <Input
                      required
                      label="Fecha"
                      type="date"
                      value={form.fecha}
                      onChange={(value) =>
                        onFormChange({
                          ...form,
                          fecha: value,
                        })
                      }
                    />

                    <Input
                      required
                      label="Hora"
                      type="time"
                      value={form.hora}
                      onChange={(value) =>
                        onFormChange({
                          ...form,
                          hora: value,
                        })
                      }
                    />
                  </div>

                  <Select
                    label="Horario de clase"
                    value={form.id_horario_clase}
                    onChange={onSelectHorario}
                  >
                    <option value="">Sin horario asociado</option>

                    {horarios.map((horario) => (
                      <option key={horario.id} value={horario.id}>
                        {diasSemana[horario.dia_semana] ??
                          `Día ${horario.dia_semana}`}{" "}
                        ·{" "}
                        {formatearRangoHorario(
                          horario.hora_inicio,
                          horario.hora_fin,
                        )}
                      </option>
                    ))}
                  </Select>

                  <Textarea
                    label="Observaciones"
                    value={form.observaciones}
                    onChange={(value) =>
                      onFormChange({
                        ...form,
                        observaciones: value,
                      })
                    }
                    placeholder="Información adicional de la asistencia"
                  />
                </Section>
              </div>
            </div>

            <footer
              className="
                flex shrink-0
                flex-col-reverse
                items-stretch gap-3
                sm:flex-row
                sm:items-center
                sm:justify-end
                border-t
                border-slate-200
                bg-white px-4 py-4
                sm:px-6 sm:py-5
              "
            >
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="
                  rounded-2xl
                  border
                  border-slate-300
                  bg-white
                  px-5 py-3
                  font-semibold
                  text-slate-700
                  transition-colors
                  hover:bg-slate-50
                  focus:outline-none
                  focus:ring-4
                  focus:ring-slate-100
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:w-auto
                "
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!seleccionada || saving}
                className="
                  flex items-center justify-center gap-2
                  rounded-2xl
                  bg-pink-600
                  px-6 py-3
                  font-semibold
                  text-white
                  shadow-sm
                  transition-colors
                  hover:bg-pink-700
                  focus:outline-none
                  focus:ring-4
                  focus:ring-pink-200
                  disabled:cursor-not-allowed
                  disabled:bg-slate-300
                  disabled:text-slate-500
                  disabled:shadow-none
                  sm:w-auto
                "
              >
                {saving ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar asistencia"
                )}
              </button>
            </footer>
          </form>
        </div>
      </aside>
    </>
  );
}

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className="
        mb-6 overflow-hidden
        rounded-3xl border
        border-slate-200
        bg-white shadow-sm
      "
    >
      <div
        className="
          flex items-center gap-3
          border-b border-slate-200
          bg-[#F5FFFB]
          px-4 py-3
          sm:px-5 sm:py-4
        "
      >
        <div
          className="
            flex h-10 w-10
            shrink-0 items-center
            justify-center
            rounded-xl
            bg-white
            text-pink-600
            shadow-sm
          "
        >
          {icon}
        </div>

        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>

          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <span className="text-sm font-semibold text-slate-700">
      {label}

      {required && (
        <span
          className="
            ml-1 font-bold
            text-red-600
          "
          aria-hidden="true"
        >
          *
        </span>
      )}
    </span>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <FieldLabel label={label} required={required} />

      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="
          rounded-2xl border
          border-slate-300
          bg-[#F5F9FF]
          px-4 py-3
          text-slate-900
          shadow-sm outline-none
          transition-colors
          placeholder:text-slate-400
          hover:border-slate-400
          focus:border-pink-400
          focus:bg-white
          focus:ring-4
          focus:ring-pink-100
        "
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <FieldLabel label={label} />

      <textarea
        value={value}
        rows={4}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="
          resize-y rounded-2xl
          border
          border-slate-300
          bg-[#F5F9FF]
          px-4 py-3
          text-slate-900
          shadow-sm outline-none
          transition-colors
          placeholder:text-slate-400
          hover:border-slate-400
          focus:border-pink-400
          focus:bg-white
          focus:ring-4
          focus:ring-pink-100
        "
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <FieldLabel label={label} required={required} />

      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="
          rounded-2xl border
          border-slate-300
          bg-[#F5F9FF]
          px-4 py-3
          text-slate-900
          shadow-sm outline-none
          transition-colors
          hover:border-slate-400
          focus:border-pink-400
          focus:bg-white
          focus:ring-4
          focus:ring-pink-100
        "
      >
        {children}
      </select>
    </label>
  );
}

function ConfirmationModal({
  open,
  title,
  message,
  confirmText,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90dvh] w-full overflow-y-auto rounded-3xl sm:max-w-md border border-slate-200 bg-white shadow-2xl"
      >
        <div className="p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">{title}</h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Seguir editando
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorModal({
  open,
  title,
  message,
  onClose,
  onRetry,
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90dvh] w-full overflow-y-auto rounded-3xl sm:max-w-md border border-slate-200 bg-white shadow-2xl"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">{title}</h2>

          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
            {message}
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cerrar
          </button>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200"
            >
              Reintentar
            </button>
          )}
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
  type: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(onClose, 3500);

    return () => window.clearTimeout(timeout);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const esError = type === "error";

  return (
    <div className="fixed bottom-3 left-3 right-3 z-[170] w-auto max-w-none sm:bottom-6 sm:left-auto sm:right-6 sm:w-[calc(100%-3rem)] sm:max-w-sm">
      <div
        role="status"
        className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl ${
          esError ? "border-red-200" : "border-green-200"
        }`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            esError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {esError ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
        </div>

        <p className="min-w-0 flex-1 pt-1.5 text-sm font-medium text-slate-700">
          {message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
