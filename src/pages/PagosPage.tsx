import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Plus,
  Search,
  UserRound,
  Wallet,
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

type Pago = {
  id: string;
  id_participante: string;
  fecha_pago: string;
  mes_abonado: number;
  anio_abonado: number;
  monto: number | null;
  observaciones: string | null;
  participantes: {
    nombre: string;
    apellido: string;
    ci: string;
    foto_perfil_path: string | null;
  } | null;
};

type PagoForm = {
  fecha_pago: string;
  mes_abonado: string;
  anio_abonado: string;
  monto: string;
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

function obtenerFechaLocal() {
  const fecha = new Date();

  const diferenciaZonaHoraria = fecha.getTimezoneOffset() * 60_000;

  return new Date(fecha.getTime() - diferenciaZonaHoraria)
    .toISOString()
    .slice(0, 10);
}

function crearFormularioInicial(): PagoForm {
  const fecha = new Date();

  return {
    fecha_pago: obtenerFechaLocal(),
    mes_abonado: String(fecha.getMonth() + 1),
    anio_abonado: String(fecha.getFullYear()),
    monto: "",
    observaciones: "",
  };
}

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-UY").format(new Date(`${fecha}T00:00:00`));
}

function formatearMonto(monto: number) {
  return `$${monto.toLocaleString("es-US")}`;
}

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

  const [snackbar, setSnackbar] = useState<SnackbarState>(SNACKBAR_INICIAL);

  const [errorModal, setErrorModal] =
    useState<ErrorModalState>(ERROR_MODAL_INICIAL);

  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const [form, setForm] = useState<PagoForm>(crearFormularioInicial);

  useEffect(() => {
    if (!snackbar.open) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSnackbar(SNACKBAR_INICIAL);
    }, 3500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [snackbar]);

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

  const mostrarErrorModal = (title: string, message: string) => {
    setErrorModal({
      open: true,
      title,
      message,
    });
  };

  const cargar = async (): Promise<boolean> => {
    setLoading(true);

    try {
      const [
        { data: pagosData, error: pagosError },
        { data: participantesData, error: participantesError },
      ] = await Promise.all([
        supabase
          .from("pagos")
          .select(
            `
              id,
              id_participante,
              fecha_pago,
              mes_abonado,
              anio_abonado,
              monto,
              observaciones,
              participantes (
                nombre,
                apellido,
                ci,
                foto_perfil_path
              )
            `,
          )
          .order("fecha_pago", {
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
      ]);

      const requestError = pagosError || participantesError;

      if (requestError) {
        setPagos([]);
        setParticipantes([]);

        mostrarErrorModal(
          "No se pudieron cargar los pagos",
          requestError.message || "Ocurrió un error al cargar los datos.",
        );

        return false;
      }

      setPagos((pagosData ?? []) as unknown as Pago[]);

      setParticipantes((participantesData ?? []) as unknown as Participante[]);

      return true;
    } catch (error) {
      setPagos([]);
      setParticipantes([]);

      mostrarErrorModal(
        "No se pudieron cargar los pagos",
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al cargar los datos.",
      );

      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const resultadosParticipantes = useMemo(() => {
    const textoBusqueda = busquedaPersona.trim().toLowerCase();

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
          busquedaPersona,
        );

        return coincideTexto || coincideCedula;
      })
      .slice(0, 6);
  }, [busquedaPersona, participantes]);

  const pagosVisibles = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    if (!textoBusqueda) {
      return pagos;
    }

    return pagos.filter((pago) => {
      const coincideTexto = [
        pago.participantes?.nombre ?? "",
        pago.participantes?.apellido ?? "",
        meses[pago.mes_abonado - 1] ?? "",
        String(pago.anio_abonado),
      ]
        .join(" ")
        .toLowerCase()
        .includes(textoBusqueda);

      const coincideCedula = FormatHelper.cedulaIncluyeBusqueda(
        pago.participantes?.ci,
        busqueda,
      );

      return coincideTexto || coincideCedula;
    });
  }, [busqueda, pagos]);

  const estadisticas = useMemo(() => {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;
    const anioActual = fechaActual.getFullYear();

    const pagosDelMes = pagos.filter(
      (pago) =>
        pago.mes_abonado === mesActual && pago.anio_abonado === anioActual,
    );

    const participantesQuePagaron = new Set(
      pagosDelMes.map((pago) => pago.id_participante),
    );

    const pendientes = Math.max(
      0,
      participantes.length - participantesQuePagaron.size,
    );

    const recaudado = pagosDelMes.reduce(
      (total, pago) => total + Number(pago.monto ?? 0),
      0,
    );

    return {
      pagosDelMes: pagosDelMes.length,
      pendientes,
      recaudado,
    };
  }, [pagos, participantes]);

  const abrirFormulario = () => {
    setBusquedaPersona("");
    setSeleccionada(null);
    setForm(crearFormularioInicial());
    setShowForm(true);
  };

  const limpiarYCerrarFormulario = () => {
    setShowForm(false);
    setBusquedaPersona("");
    setSeleccionada(null);
    setForm(crearFormularioInicial());
    setConfirmCloseOpen(false);
  };

  const cerrarFormulario = () => {
    if (saving) {
      return;
    }

    const inicial = crearFormularioInicial();

    const tieneCambios =
      Boolean(seleccionada) ||
      busquedaPersona.trim().length > 0 ||
      form.fecha_pago !== inicial.fecha_pago ||
      form.mes_abonado !== inicial.mes_abonado ||
      form.anio_abonado !== inicial.anio_abonado ||
      form.monto.trim().length > 0 ||
      form.observaciones.trim().length > 0;

    if (tieneCambios) {
      setConfirmCloseOpen(true);
      return;
    }

    limpiarYCerrarFormulario();
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!seleccionada) {
      mostrarSnackbar("Seleccioná una participante antes de guardar.", "error");

      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from("pagos").insert({
        id_participante: seleccionada.id,

        fecha_pago: form.fecha_pago,

        mes_abonado: Number(form.mes_abonado),

        anio_abonado: Number(form.anio_abonado),

        monto: form.monto ? Number(form.monto) : null,

        observaciones: form.observaciones.trim() || null,
      });

      if (error) {
        mostrarErrorModal(
          "No se pudo registrar el pago",
          error.message || "Ocurrió un error al guardar el pago.",
        );

        return;
      }

      const nombreParticipante =
        `${seleccionada.nombre} ${seleccionada.apellido}`.trim();

      setShowForm(false);
      setSeleccionada(null);
      setBusquedaPersona("");
      setForm(crearFormularioInicial());

      const cargaCorrecta = await cargar();

      if (cargaCorrecta) {
        mostrarSnackbar(
          `El pago de ${nombreParticipante} se registró correctamente.`,
        );
      }
    } catch (error) {
      mostrarErrorModal(
        "No se pudo registrar el pago",
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al guardar el pago.",
      );
    } finally {
      setSaving(false);
    }
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
              Pagos
            </h1>

            <p className="mt-1 text-sm text-slate-500 sm:mt-2 sm:text-base">
              Control de pagos mensuales
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
            Registrar pago
          </button>
        </div>

        <div
          className="
            grid grid-cols-2 gap-3
            md:grid-cols-3 md:gap-6
          "
        >
          <Stat
            label="Pagos del mes"
            value={String(estadisticas.pagosDelMes)}
            icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
            iconBackground="bg-green-50"
          />

          <Stat
            label="Pendientes"
            value={String(estadisticas.pendientes)}
            icon={<AlertCircle className="h-6 w-6 text-red-500" />}
            iconBackground="bg-red-50"
            valueClass="text-red-500"
          />

          <Stat
            label="Recaudado"
            value={formatearMonto(estadisticas.recaudado)}
            icon={<Wallet className="h-6 w-6 text-pink-600" />}
            iconBackground="bg-pink-50"
            valueClass="text-pink-600"
          />
        </div>

        <div className="flex flex-col gap-3 md:hidden">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Historial de pagos
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Pagos efectivamente registrados
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
              Cargando pagos...
            </Card>
          ) : pagosVisibles.length === 0 ? (
            <Card className="p-4 text-center text-sm text-slate-500">
              No se encontraron pagos.
            </Card>
          ) : (
            pagosVisibles.map((pago) => (
              <button
                type="button"
                key={pago.id}
                onClick={() =>
                  navigate(`/participantes/${pago.id_participante}?tab=pagos`)
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
                    path={pago.participantes?.foto_perfil_path ?? null}
                    nombre={
                      pago.participantes
                        ? `${pago.participantes.nombre} ${pago.participantes.apellido}`
                        : "Participante"
                    }
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {pago.participantes?.nombre ?? "Sin datos"}{" "}
                          {pago.participantes?.apellido ?? ""}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          CI:{" "}
                          {FormatHelper.mostrarCedula(pago.participantes?.ci)}
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-bold text-pink-600">
                        {pago.monto === null
                          ? "Sin monto"
                          : formatearMonto(Number(pago.monto))}
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
                          Período
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {meses[pago.mes_abonado - 1] ?? "Sin registrar"}{" "}
                          {pago.anio_abonado}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Fecha
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatearFecha(pago.fecha_pago)}
                        </p>
                      </div>
                    </div>
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
                  Historial de pagos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Pagos efectivamente registrados
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

                    <TableHeader>Mes</TableHeader>

                    <TableHeader>Fecha de pago</TableHeader>

                    <TableHeader>Monto</TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="
                        px-6 py-12
                        text-center
                        text-slate-500
                      "
                      >
                        Cargando pagos...
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    pagosVisibles.map((pago) => (
                      <tr
                        key={pago.id}
                        onClick={() =>
                          navigate(
                            `/participantes/${pago.id_participante}?tab=pagos`,
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
                            path={pago.participantes?.foto_perfil_path ?? null}
                            nombre={
                              pago.participantes
                                ? `${pago.participantes.nombre} ${pago.participantes.apellido}`
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
                          {pago.participantes?.nombre ?? "Sin datos"}{" "}
                          {pago.participantes?.apellido ?? ""}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                            text-slate-600
                          "
                        >
                          {FormatHelper.mostrarCedula(pago.participantes?.ci)}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                            text-slate-700
                          "
                        >
                          {meses[pago.mes_abonado - 1] ?? "Sin registrar"}{" "}
                          {pago.anio_abonado}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                            text-slate-600
                          "
                        >
                          {formatearFecha(pago.fecha_pago)}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                            font-semibold
                            text-slate-900
                          "
                        >
                          {pago.monto === null
                            ? "Sin registrar"
                            : formatearMonto(Number(pago.monto))}
                        </td>
                      </tr>
                    ))}

                  {!loading && pagosVisibles.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="
                          px-6 py-12
                          text-center
                          text-slate-500
                        "
                      >
                        No se encontraron pagos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <RegistrarPagoPanel
        open={showForm}
        participantesEncontradas={resultadosParticipantes}
        seleccionada={seleccionada}
        busquedaPersona={busquedaPersona}
        form={form}
        saving={saving}
        onBusquedaChange={(value) => {
          setBusquedaPersona(value);
          setSeleccionada(null);
        }}
        onSelectParticipante={(participante) => {
          setSeleccionada(participante);

          setBusquedaPersona(`${participante.nombre} ${participante.apellido}`);
        }}
        onFormChange={setForm}
        onClose={cerrarFormulario}
        onSubmit={guardar}
      />

      <ConfirmationModal
        open={confirmCloseOpen}
        title="Descartar pago sin guardar"
        message="Hay datos cargados que todavía no se guardaron. ¿Querés cerrar el formulario y descartarlos?"
        confirmText="Descartar"
        onCancel={() => setConfirmCloseOpen(false)}
        onConfirm={limpiarYCerrarFormulario}
      />

      <ErrorModal
        open={errorModal.open}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal(ERROR_MODAL_INICIAL)}
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
  valueClass = "text-slate-900",
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
              mt-2 text-2xl
              sm:mt-3 sm:text-4xl
              font-bold
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

function RegistrarPagoPanel({
  open,
  participantesEncontradas,
  seleccionada,
  busquedaPersona,
  form,
  saving,
  onBusquedaChange,
  onSelectParticipante,
  onFormChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  participantesEncontradas: Participante[];
  seleccionada: Participante | null;
  busquedaPersona: string;
  form: PagoForm;
  saving: boolean;
  onBusquedaChange: (value: string) => void;
  onSelectParticipante: (participante: Participante) => void;
  onFormChange: (form: PagoForm) => void;
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
          border-l border-slate-200
          sm:max-w-[760px]
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
              justify-between
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
                  items-center
                  justify-center
                  rounded-2xl
                  bg-pink-100
                  text-pink-700
                "
              >
                <Wallet className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Registrar pago
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
                flex-1 overflow-y-auto
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
                  value={busquedaPersona}
                  onChange={onBusquedaChange}
                  placeholder="Ingresá al menos 2 caracteres"
                />

                {!seleccionada &&
                  busquedaPersona.trim().length >= 2 &&
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
                  title="Datos del pago"
                  description="Fecha, período abonado y monto."
                  icon={<Wallet className="h-5 w-5" />}
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
                      label="Fecha de pago"
                      type="date"
                      value={form.fecha_pago}
                      onChange={(value) =>
                        onFormChange({
                          ...form,
                          fecha_pago: value,
                        })
                      }
                    />

                    <Input
                      label="Monto"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.monto}
                      onChange={(value) =>
                        onFormChange({
                          ...form,
                          monto: value,
                        })
                      }
                      placeholder="Ingresá el monto"
                    />

                    <Select
                      required
                      label="Mes abonado"
                      value={form.mes_abonado}
                      onChange={(value) =>
                        onFormChange({
                          ...form,
                          mes_abonado: value,
                        })
                      }
                    >
                      {meses.map((mes, index) => (
                        <option key={mes} value={index + 1}>
                          {mes}
                        </option>
                      ))}
                    </Select>

                    <Input
                      required
                      label="Año abonado"
                      type="number"
                      min="2000"
                      max="2100"
                      value={form.anio_abonado}
                      onChange={(value) =>
                        onFormChange({
                          ...form,
                          anio_abonado: value,
                        })
                      }
                    />
                  </div>

                  <Textarea
                    label="Observaciones"
                    value={form.observaciones}
                    onChange={(value) =>
                      onFormChange({
                        ...form,
                        observaciones: value,
                      })
                    }
                    placeholder="Información adicional del pago"
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
                  <span className="flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  "Guardar pago"
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
          border-b
          border-slate-200
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
            rounded-xl bg-white
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
  min,
  max,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <FieldLabel label={label} required={required} />

      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
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
          resize-y
          rounded-2xl
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
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) {
    return null;
  }

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
        aria-labelledby="close-payment-modal-title"
        aria-describedby="close-payment-modal-message"
        className="
          max-h-[90dvh] w-full overflow-y-auto
          sm:max-w-md
          rounded-3xl border border-slate-200
          bg-white shadow-2xl
        "
      >
        <div className="p-6">
          <div
            className="
              flex h-14 w-14 items-center
              justify-center rounded-2xl
              bg-red-100 text-red-700
            "
          >
            <AlertCircle className="h-7 w-7" />
          </div>

          <h2
            id="close-payment-modal-title"
            className="mt-5 text-xl font-bold text-slate-900"
          >
            {title}
          </h2>

          <p
            id="close-payment-modal-message"
            className="mt-2 text-sm leading-6 text-slate-600"
          >
            {message}
          </p>
        </div>

        <div
          className="
            flex flex-col-reverse gap-3
            border-t border-slate-200
            bg-slate-50 px-6 py-5
            sm:flex-row sm:justify-end
          "
        >
          <button
            type="button"
            onClick={onCancel}
            className="
              rounded-2xl border border-slate-300
              bg-white px-5 py-3 font-semibold
              text-slate-700 transition
              hover:bg-slate-100
              focus:outline-none focus:ring-4
              focus:ring-slate-200
            "
          >
            Seguir editando
          </button>

          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="
              rounded-2xl bg-red-600
              px-5 py-3 font-semibold text-white
              shadow-sm transition hover:bg-red-700
              focus:outline-none focus:ring-4
              focus:ring-red-200
            "
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
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-[160]
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
        aria-labelledby="payment-error-modal-title"
        aria-describedby="payment-error-modal-message"
        className="
          max-h-[90dvh] w-full overflow-y-auto
          sm:max-w-md
          rounded-3xl border border-slate-200
          bg-white shadow-2xl
        "
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div
              className="
                flex h-14 w-14 shrink-0
                items-center justify-center
                rounded-2xl bg-red-100 text-red-700
              "
            >
              <AlertCircle className="h-7 w-7" />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="
                rounded-full p-2 text-slate-400
                transition hover:bg-slate-100
                hover:text-slate-700
                focus:outline-none focus:ring-4
                focus:ring-slate-100
              "
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h2
            id="payment-error-modal-title"
            className="mt-5 text-xl font-bold text-slate-900"
          >
            {title}
          </h2>

          <p
            id="payment-error-modal-message"
            className="
              mt-2 whitespace-pre-line
              text-sm leading-6 text-slate-600
            "
          >
            {message}
          </p>
        </div>

        <div
          className="
            flex justify-end border-t
            border-slate-200 bg-slate-50
            px-6 py-5
          "
        >
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="
              rounded-2xl bg-red-600
              px-6 py-3 font-semibold text-white
              shadow-sm transition hover:bg-red-700
              focus:outline-none focus:ring-4
              focus:ring-red-200
            "
          >
            Entendido
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
  type: "success" | "error";
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
        animate-[snackbar-in_180ms_ease-out]
      "
      role="status"
      aria-live="polite"
    >
      <div
        className={`
          flex items-start gap-3 rounded-2xl
          border bg-white p-4 shadow-xl
          ${esError ? "border-red-200" : "border-green-200"}
        `}
      >
        <div
          className={`
            mt-0.5 flex h-9 w-9 shrink-0
            items-center justify-center rounded-xl
            ${
              esError
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }
          `}
        >
          {esError ? (
            <AlertCircle className="h-5 w-5" />
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
            rounded-full p-1.5 text-slate-400
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
