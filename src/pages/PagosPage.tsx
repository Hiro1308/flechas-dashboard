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

const FOTO_BUCKET = "fotos-participantes";

const PLACEHOLDER_FOTO =
  "/placeholder_person.png";

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

  const diferenciaZonaHoraria =
    fecha.getTimezoneOffset() * 60_000;

  return new Date(
    fecha.getTime() - diferenciaZonaHoraria,
  )
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
  return new Intl.DateTimeFormat("es-UY").format(
    new Date(`${fecha}T00:00:00`),
  );
}

function formatearMonto(monto: number) {
  return `$${monto.toLocaleString("es-US")}`;
}

export default function PagosPage() {
  const navigate = useNavigate();

  const [pagos, setPagos] = useState<Pago[]>([]);

  const [
    participantes,
    setParticipantes,
  ] = useState<Participante[]>([]);

  const [showForm, setShowForm] =
    useState(false);

  const [busqueda, setBusqueda] =
    useState("");

  const [
    busquedaPersona,
    setBusquedaPersona,
  ] = useState("");

  const [seleccionada, setSeleccionada] =
    useState<Participante | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [pageError, setPageError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [form, setForm] =
    useState<PagoForm>(
      crearFormularioInicial,
    );

  const cargar = async () => {
    setLoading(true);
    setPageError("");

    const [
      {
        data: pagosData,
        error: pagosError,
      },
      {
        data: participantesData,
        error: participantesError,
      },
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

    if (pagosError || participantesError) {
      setPageError(
        pagosError?.message ||
          participantesError?.message ||
          "No fue posible cargar los pagos.",
      );

      setPagos([]);
      setParticipantes([]);
    } else {
      setPagos(
        (pagosData ??
          []) as unknown as Pago[],
      );

      setParticipantes(
        (participantesData ??
          []) as unknown as Participante[],
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    void cargar();
  }, []);

  const resultadosParticipantes =
    useMemo(() => {
      const textoBusqueda =
        busquedaPersona
          .trim()
          .toLowerCase();

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

          const coincideCedula =
            FormatHelper.cedulaIncluyeBusqueda(
              participante.ci,
              busquedaPersona,
            );

          return (
            coincideTexto ||
            coincideCedula
          );
        })
        .slice(0, 6);
    }, [
      busquedaPersona,
      participantes,
    ]);

  const pagosVisibles = useMemo(() => {
    const textoBusqueda = busqueda
      .trim()
      .toLowerCase();

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

      const coincideCedula =
        FormatHelper.cedulaIncluyeBusqueda(
          pago.participantes?.ci,
          busqueda,
        );

      return (
        coincideTexto ||
        coincideCedula
      );
    });
  }, [busqueda, pagos]);

  const estadisticas = useMemo(() => {
    const fechaActual = new Date();
    const mesActual =
      fechaActual.getMonth() + 1;
    const anioActual =
      fechaActual.getFullYear();

    const pagosDelMes = pagos.filter(
      (pago) =>
        pago.mes_abonado === mesActual &&
        pago.anio_abonado === anioActual,
    );

    const participantesQuePagaron =
      new Set(
        pagosDelMes.map(
          (pago) =>
            pago.id_participante,
        ),
      );

    const pendientes = Math.max(
      0,
      participantes.length -
        participantesQuePagaron.size,
    );

    const recaudado = pagosDelMes.reduce(
      (total, pago) =>
        total +
        Number(pago.monto ?? 0),
      0,
    );

    return {
      pagosDelMes: pagosDelMes.length,
      pendientes,
      recaudado,
    };
  }, [pagos, participantes]);

  const abrirFormulario = () => {
    setFormError("");
    setBusquedaPersona("");
    setSeleccionada(null);
    setForm(crearFormularioInicial());
    setShowForm(true);
  };

  const cerrarFormulario = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setFormError("");
    setBusquedaPersona("");
    setSeleccionada(null);
  };

  const guardar = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!seleccionada) {
      setFormError(
        "Seleccioná una participante antes de guardar.",
      );

      return;
    }

    setSaving(true);
    setFormError("");

    const { error } = await supabase
      .from("pagos")
      .insert({
        id_participante:
          seleccionada.id,

        fecha_pago:
          form.fecha_pago,

        mes_abonado:
          Number(form.mes_abonado),

        anio_abonado:
          Number(form.anio_abonado),

        monto: form.monto
          ? Number(form.monto)
          : null,

        observaciones:
          form.observaciones.trim() ||
          null,
      });

    if (error) {
      setFormError(error.message);
      setSaving(false);

      return;
    }

    setShowForm(false);
    setSeleccionada(null);
    setBusquedaPersona("");
    setForm(crearFormularioInicial());

    await cargar();

    setSaving(false);
  };

  return (
    <div className="relative flex flex-col gap-6">
      <div
        className={`
          flex flex-col gap-6
          transition-opacity duration-300
          ${
            showForm
              ? "pointer-events-none opacity-40"
              : "opacity-100"
          }
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
            <h1 className="text-3xl font-bold text-slate-900">
              Pagos
            </h1>

            <p className="mt-2 text-slate-500">
              Control de pagos mensuales
            </p>
          </div>

          <button
            type="button"
            onClick={abrirFormulario}
            className="
              flex items-center
              justify-center gap-2
              rounded-2xl bg-pink-600
              px-5 py-3 font-semibold
              text-white shadow-sm
              transition-colors
              hover:bg-pink-700
              focus:outline-none
              focus:ring-4
              focus:ring-pink-200
            "
          >
            <Plus className="h-5 w-5" />

            Registrar pago
          </button>
        </div>

        <div
          className="
            grid grid-cols-1 gap-4
            md:grid-cols-3 md:gap-6
          "
        >
          <Stat
            label="Pagos del mes"
            value={String(
              estadisticas.pagosDelMes,
            )}
            icon={
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            }
            iconBackground="bg-green-50"
          />

          <Stat
            label="Pendientes"
            value={String(
              estadisticas.pendientes,
            )}
            icon={
              <AlertCircle className="h-6 w-6 text-red-500" />
            }
            iconBackground="bg-red-50"
            valueClass="text-red-500"
          />

          <Stat
            label="Recaudado"
            value={formatearMonto(
              estadisticas.recaudado,
            )}
            icon={
              <Wallet className="h-6 w-6 text-pink-600" />
            }
            iconBackground="bg-pink-50"
            valueClass="text-pink-600"
          />
        </div>

        {pageError && (
          <div
            className="
              rounded-2xl border
              border-red-200 bg-red-50
              px-4 py-3 text-sm
              text-red-700
            "
          >
            {pageError}
          </div>
        )}

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
                onChange={(event) =>
                  setBusqueda(
                    event.target.value,
                  )
                }
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

                  <TableHeader>
                    Participante
                  </TableHeader>

                  <TableHeader>
                    CI
                  </TableHeader>

                  <TableHeader>
                    Mes
                  </TableHeader>

                  <TableHeader>
                    Fecha de pago
                  </TableHeader>

                  <TableHeader>
                    Monto
                  </TableHeader>
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
                  pagosVisibles.map(
                    (pago) => (
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
                            path={
                              pago
                                .participantes
                                ?.foto_perfil_path ??
                              null
                            }
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
                          {pago
                            .participantes
                            ?.nombre ??
                            "Sin datos"}{" "}
                          {pago
                            .participantes
                            ?.apellido ?? ""}
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
                          {meses[
                            pago.mes_abonado -
                              1
                          ] ??
                            "Sin registrar"}{" "}
                          {pago.anio_abonado}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                            text-slate-600
                          "
                        >
                          {formatearFecha(
                            pago.fecha_pago,
                          )}
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
                            : formatearMonto(
                                Number(
                                  pago.monto,
                                ),
                              )}
                        </td>
                      </tr>
                    ),
                  )}

                {!loading &&
                  pagosVisibles.length ===
                    0 && (
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

      <RegistrarPagoPanel
        open={showForm}
        participantesEncontradas={
          resultadosParticipantes
        }
        seleccionada={seleccionada}
        busquedaPersona={
          busquedaPersona
        }
        form={form}
        saving={saving}
        error={formError}
        onBusquedaChange={(value) => {
          setBusquedaPersona(value);
          setSeleccionada(null);
          setFormError("");
        }}
        onSelectParticipante={(
          participante,
        ) => {
          setSeleccionada(participante);

          setBusquedaPersona(
            `${participante.nombre} ${participante.apellido}`,
          );

          setFormError("");
        }}
        onFormChange={setForm}
        onClose={cerrarFormulario}
        onSubmit={guardar}
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
  const [imageError, setImageError] =
    useState(false);

  useEffect(() => {
    setImageError(false);
  }, [path]);

  const fotoUrl = useMemo(() => {
    if (!path) {
      return null;
    }

    const { data } = supabase.storage
      .from(FOTO_BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  }, [path]);

  const src =
    fotoUrl && !imageError
      ? fotoUrl
      : PLACEHOLDER_FOTO;

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
          if (
            src !== PLACEHOLDER_FOTO
          ) {
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
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <h2
            className={`
              mt-3 text-4xl
              font-bold
              ${valueClass}
            `}
          >
            {value}
          </h2>
        </div>

        <div
          className={`
            flex h-12 w-12
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

function TableHeader({
  children,
}: {
  children: ReactNode;
}) {
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
  error,
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
  error: string;
  onBusquedaChange: (
    value: string,
  ) => void;
  onSelectParticipante: (
    participante: Participante,
  ) => void;
  onFormChange: (
    form: PagoForm,
  ) => void;
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
}) {
  const formularioHabilitado =
    Boolean(seleccionada);

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
          max-w-[760px]
          overflow-hidden
          border-l border-slate-200
          bg-[#FFF5F9]
          shadow-2xl
          transform-gpu
          will-change-transform
          transition-transform
          duration-300 ease-out
          ${
            open
              ? "translate-x-0"
              : "translate-x-full"
          }
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
              bg-white px-6 py-5
            "
          >
            <div className="flex items-center gap-4">
              <div
                className="
                  flex h-12 w-12
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
                <h2 className="text-2xl font-bold text-slate-900">
                  Registrar pago
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Seleccioná una participante
                  y completá los datos.
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
                px-6 py-6
              "
            >
              <Section
                title="Participante"
                description="Buscá por nombre, cédula o teléfono."
                icon={
                  <UserRound className="h-5 w-5" />
                }
              >
                <Input
                  required
                  label="Buscar participante"
                  value={busquedaPersona}
                  onChange={
                    onBusquedaChange
                  }
                  placeholder="Ingresá al menos 2 caracteres"
                />

                {!seleccionada &&
                  busquedaPersona
                    .trim().length >= 2 &&
                  participantesEncontradas
                    .length === 0 && (
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
                      No se encontraron
                      participantes.
                    </div>
                  )}

                {!seleccionada &&
                  participantesEncontradas
                    .length > 0 && (
                    <div className="flex flex-col gap-2">
                      {participantesEncontradas.map(
                        (participante) => (
                          <button
                            key={
                              participante.id
                            }
                            type="button"
                            onClick={() =>
                              onSelectParticipante(
                                participante,
                              )
                            }
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
                              {
                                participante.nombre
                              }{" "}
                              {
                                participante.apellido
                              }
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              CI:{" "}
                              {FormatHelper.mostrarCedula(
                                participante.ci,
                              )}
                            </p>

                            {participante.telefono && (
                              <p className="mt-1 text-sm text-slate-500">
                                Teléfono:{" "}
                                {
                                  participante.telefono
                                }
                              </p>
                            )}
                          </button>
                        ),
                      )}
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
                        {
                          seleccionada.nombre
                        }{" "}
                        {
                          seleccionada.apellido
                        }
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        CI:{" "}
                        {FormatHelper.mostrarCedula(
                          seleccionada.ci,
                        )}
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
                aria-disabled={
                  !formularioHabilitado
                }
              >
                <Section
                  title="Datos del pago"
                  description="Fecha, período abonado y monto."
                  icon={
                    <Wallet className="h-5 w-5" />
                  }
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
                      value={
                        form.fecha_pago
                      }
                      onChange={(value) =>
                        onFormChange({
                          ...form,
                          fecha_pago:
                            value,
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
                      value={
                        form.mes_abonado
                      }
                      onChange={(value) =>
                        onFormChange({
                          ...form,
                          mes_abonado:
                            value,
                        })
                      }
                    >
                      {meses.map(
                        (mes, index) => (
                          <option
                            key={mes}
                            value={
                              index + 1
                            }
                          >
                            {mes}
                          </option>
                        ),
                      )}
                    </Select>

                    <Input
                      required
                      label="Año abonado"
                      type="number"
                      min="2000"
                      max="2100"
                      value={
                        form.anio_abonado
                      }
                      onChange={(value) =>
                        onFormChange({
                          ...form,
                          anio_abonado:
                            value,
                        })
                      }
                    />
                  </div>

                  <Textarea
                    label="Observaciones"
                    value={
                      form.observaciones
                    }
                    onChange={(value) =>
                      onFormChange({
                        ...form,
                        observaciones:
                          value,
                      })
                    }
                    placeholder="Información adicional del pago"
                  />
                </Section>
              </div>

              {error && (
                <div
                  className="
                    rounded-2xl
                    border
                    border-red-200
                    bg-red-50
                    px-4 py-3
                    text-sm
                    font-medium
                    text-red-700
                  "
                >
                  {error}
                </div>
              )}
            </div>

            <footer
              className="
                flex shrink-0
                items-center
                justify-end gap-3
                border-t
                border-slate-200
                bg-white px-6 py-5
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
                "
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  !seleccionada ||
                  saving
                }
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
                "
              >
                {saving
                  ? "Guardando..."
                  : "Guardar pago"}
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
          px-5 py-4
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
          <h3 className="font-bold text-slate-900">
            {title}
          </h3>

          <p className="mt-0.5 text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {children}
      </div>
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
  onChange: (
    value: string,
  ) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <FieldLabel
        label={label}
        required={required}
      />

      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
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
  onChange: (
    value: string,
  ) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <FieldLabel label={label} />

      <textarea
        value={value}
        rows={4}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
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
  onChange: (
    value: string,
  ) => void;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <FieldLabel
        label={label}
        required={required}
      />

      <select
        value={value}
        required={required}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
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