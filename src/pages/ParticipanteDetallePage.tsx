import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Ban,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  HeartPulse,
  LoaderCircle,
  Pencil,
  Save,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import ArchivosParticipante, {
  type ArchivoParticipante,
} from "../components/participantes/ArchivosParticipante";
import Card from "../components/ui/Card";
import FormatHelper from "../helpers/FormatHelper";
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
  foto_perfil_path: string | null;
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

type FieldType = "text" | "email" | "date" | "textarea" | "select" | "cedula";

type FieldOption = {
  label: string;
  value: string;
};

type EditableField = {
  key: keyof Participante;
  label: string;
  type?: FieldType;
  options?: FieldOption[];
  placeholder?: string;
};

type EditableValues = Record<string, string>;

type ErrorModalState = {
  open: boolean;
  title: string;
  message: string;
};

type SnackbarState = {
  open: boolean;
  type: "success" | "error";
  message: string;
};

type ConfirmationModalState = {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  variant: "primary" | "danger";
};

const ERROR_MODAL_INICIAL: ErrorModalState = {
  open: false,
  title: "",
  message: "",
};

const SNACKBAR_INICIAL: SnackbarState = {
  open: false,
  type: "success",
  message: "",
};

const CONFIRMATION_MODAL_INICIAL: ConfirmationModalState = {
  open: false,
  title: "",
  message: "",
  confirmText: "Confirmar",
  variant: "primary",
};

const FOTO_BUCKET = "fotos-participantes";
const MAX_FOTO_SIZE = 5 * 1024 * 1024;

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

const opcionesBooleanas: FieldOption[] = [
  {
    label: "Sin registrar",
    value: "",
  },
  {
    label: "Sí",
    value: "true",
  },
  {
    label: "No",
    value: "false",
  },
];

function formatearFecha(value?: string | null) {
  if (!value) {
    return "Sin registrar";
  }

  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value.includes("T") ? value : `${value}T00:00:00`));
}

function formatearFechaHora(value?: string | null) {
  if (!value) {
    return "Sin registrar";
  }

  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).format(new Date(value));
}

function formatearHora(value?: string | null) {
  if (!value) {
    return "—";
  }

  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).format(new Date(value));
}

function formatearHorario(inicio?: string | null, fin?: string | null) {
  const horaInicio = formatearHora(inicio);

  if (horaInicio === "—") {
    return "Sin horario";
  }

  const horaFin = formatearHora(fin);

  return horaFin === "—" ? horaInicio : `${horaInicio} - ${horaFin}`;
}

function obtenerUrlFoto(path?: string | null) {
  if (!path) {
    return null;
  }

  const { data } = supabase.storage.from(FOTO_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

function obtenerExtensionFoto(archivo: File) {
  const extensionNombre = archivo.name.split(".").pop()?.toLowerCase();

  if (
    extensionNombre &&
    ["jpg", "jpeg", "png", "webp"].includes(extensionNombre)
  ) {
    return extensionNombre === "jpeg" ? "jpg" : extensionNombre;
  }

  switch (archivo.type) {
    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    default:
      return "jpg";
  }
}

const participanteToEditableValues = (
  participante: Participante,
  fields: EditableField[],
): EditableValues => {
  const values: EditableValues = {};

  fields.forEach((field) => {
    const value = participante[field.key];

    if (field.type === "cedula") {
      values[field.key] = FormatHelper.formatearCedula(
        value == null ? "" : String(value),
      );

      return;
    }

    if (typeof value === "boolean") {
      values[field.key] = value ? "true" : "false";

      return;
    }

    values[field.key] = value == null ? "" : String(value);
  });

  return values;
};

const areValuesEqual = (original: EditableValues, current: EditableValues) => {
  const keys = new Set([...Object.keys(original), ...Object.keys(current)]);

  return [...keys].every(
    (key) => (original[key] ?? "") === (current[key] ?? ""),
  );
};

const cleanTextValue = (value: string) => {
  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
};

export default function ParticipanteDetallePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get("tab");

  const tab: Tab = (
    ["datos", "pagos", "asistencias", "archivos"].includes(rawTab ?? "")
      ? rawTab
      : "datos"
  ) as Tab;

  const [participante, setParticipante] = useState<Participante | null>(null);

  const [pagos, setPagos] = useState<Pago[]>([]);

  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);

  const [archivos, setArchivos] = useState<ArchivoParticipante[]>([]);

  const [loading, setLoading] = useState(true);

  const [savingCard, setSavingCard] = useState<string | null>(null);

  const [changingStatus, setChangingStatus] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [photoVersion, setPhotoVersion] = useState(0);

  const [imageError, setImageError] = useState(false);

  const [errorModal, setErrorModal] =
    useState<ErrorModalState>(ERROR_MODAL_INICIAL);

  const [snackbar, setSnackbar] = useState<SnackbarState>(SNACKBAR_INICIAL);

  const [confirmationModal, setConfirmationModal] =
    useState<ConfirmationModalState>(CONFIRMATION_MODAL_INICIAL);

  useEffect(() => {
    if (!id) {
      return;
    }

    void (async () => {
      setLoading(true);
      setErrorModal(ERROR_MODAL_INICIAL);

      const [
        { data: participanteData, error: participanteError },
        { data: pagosData, error: pagosError },
        { data: asistenciasData, error: asistenciasError },
        { data: archivosData, error: archivosError },
      ] = await Promise.all([
        supabase.from("participantes").select("*").eq("id", id).single(),

        supabase
          .from("pagos")
          .select("*")
          .eq("id_participante", id)
          .order("fecha_pago", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("asistencias")
          .select("*")
          .eq("id_participante", id)
          .order("fecha", {
            ascending: false,
          }),

        supabase
          .from("archivos_participante")
          .select("*")
          .eq("id_participante", id)
          .order("created_at", {
            ascending: false,
          }),
      ]);

      const requestError =
        participanteError || pagosError || asistenciasError || archivosError;

      if (requestError) {
        setErrorModal({
          open: true,
          title: "No se pudo cargar la ficha",
          message:
            requestError.message ||
            "Ocurrió un error al cargar los datos de la participante.",
        });
      } else {
        setParticipante(participanteData as Participante);

        setPagos((pagosData ?? []) as Pago[]);

        setAsistencias((asistenciasData ?? []) as Asistencia[]);

        setArchivos((archivosData ?? []) as ArchivoParticipante[]);
      }

      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    setImageError(false);
  }, [participante?.foto_perfil_path]);

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

  const mostrarError = (
    message: string,
    title = "No se pudo completar la operación",
  ) => {
    setErrorModal({
      open: true,
      title,
      message,
    });
  };

  const cerrarErrorModal = () => {
    setErrorModal(ERROR_MODAL_INICIAL);
  };

  const cerrarSnackbar = () => {
    setSnackbar(SNACKBAR_INICIAL);
  };

  const cerrarConfirmationModal = () => {
    if (changingStatus) {
      return;
    }

    setConfirmationModal(CONFIRMATION_MODAL_INICIAL);
  };

  const guardarParticipante = async (
    cardId: string,
    cambios: Partial<Participante>,
  ) => {
    if (!id || !participante) {
      return false;
    }

    setSavingCard(cardId);
    setErrorModal(ERROR_MODAL_INICIAL);

    const { data, error: updateError } = await supabase
      .from("participantes")
      .update(cambios)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      mostrarError(
        updateError.code === "23505"
          ? "Ya existe una participante con esa cédula."
          : updateError.message || "No se pudieron guardar los cambios.",
      );

      setSavingCard(null);

      return false;
    }

    setParticipante(data as Participante);

    mostrarSnackbar("Los cambios se guardaron correctamente.");

    setSavingCard(null);

    return true;
  };

  const subirFotoPerfil = async (event: ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];

    event.target.value = "";

    if (!archivo || !id || !participante) {
      return;
    }

    const formatosPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!formatosPermitidos.includes(archivo.type)) {
      mostrarSnackbar(
        "La foto debe estar en formato JPG, PNG o WEBP.",
        "error",
      );
      return;
    }

    if (archivo.size > MAX_FOTO_SIZE) {
      mostrarSnackbar("La foto no puede superar los 5 MB.", "error");
      return;
    }

    setUploadingPhoto(true);
    setErrorModal(ERROR_MODAL_INICIAL);

    const extension = obtenerExtensionFoto(archivo);
    const nuevaRuta =
      `participantes/${id}/perfil-` + `${Date.now()}.${extension}`;
    const rutaAnterior = participante.foto_perfil_path;

    try {
      const { error: uploadError } = await supabase.storage
        .from(FOTO_BUCKET)
        .upload(nuevaRuta, archivo, {
          cacheControl: "3600",
          upsert: false,
          contentType: archivo.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: participanteActualizado, error: updateError } =
        await supabase
          .from("participantes")
          .update({
            foto_perfil_path: nuevaRuta,
          })
          .eq("id", id)
          .select("*")
          .single();

      if (updateError) {
        await supabase.storage.from(FOTO_BUCKET).remove([nuevaRuta]);
        throw updateError;
      }

      setParticipante(participanteActualizado as Participante);
      setImageError(false);
      setPhotoVersion(Date.now());

      if (rutaAnterior && rutaAnterior !== nuevaRuta) {
        const { error: removeError } = await supabase.storage
          .from(FOTO_BUCKET)
          .remove([rutaAnterior]);

        if (removeError) {
          console.error("No se pudo borrar la foto anterior:", removeError);
        }
      }

      mostrarSnackbar("La foto de perfil se actualizó correctamente.");
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo actualizar la foto.";

      mostrarError(message, "No se pudo actualizar la foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const solicitarCambioEstado = () => {
    if (!participante) {
      return;
    }

    const estaActiva = participante.estado === "activa";

    setConfirmationModal({
      open: true,
      title: estaActiva
        ? "Dar de baja a la participante"
        : "Reactivar participante",
      message: estaActiva
        ? `¿Confirmás que querés dar de baja a ${participante.nombre} ${participante.apellido}?`
        : `¿Confirmás que querés reactivar a ${participante.nombre} ${participante.apellido}?`,
      confirmText: estaActiva ? "Sí, dar de baja" : "Sí, reactivar",
      variant: estaActiva ? "danger" : "primary",
    });
  };

  const cambiarEstadoParticipante = async () => {
    if (!id || !participante) {
      return;
    }

    const nuevoEstado = participante.estado === "activa" ? "baja" : "activa";

    const fechaEgreso =
      nuevoEstado === "baja" ? new Date().toISOString().slice(0, 10) : null;

    setChangingStatus(true);
    setErrorModal(ERROR_MODAL_INICIAL);

    try {
      const { data, error: updateError } = await supabase
        .from("participantes")
        .update({
          estado: nuevoEstado,
          fecha_egreso: fechaEgreso,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (updateError) {
        mostrarError(
          updateError.message ||
            "No se pudo cambiar el estado de la participante.",
        );

        return;
      }

      setParticipante(data as Participante);

      setConfirmationModal(CONFIRMATION_MODAL_INICIAL);

      mostrarSnackbar(
        nuevoEstado === "baja"
          ? "La participante fue dada de baja."
          : "La participante fue reactivada.",
      );
    } catch (statusError) {
      mostrarError(
        statusError instanceof Error
          ? statusError.message
          : "No se pudo cambiar el estado de la participante.",
      );
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) {
    return (
      <div
        className="
          rounded-3xl border border-slate-200
          bg-white p-8 text-center
          sm:p-12
          text-slate-500 shadow-sm
        "
      >
        Cargando ficha...
      </div>
    );
  }

  if (!participante) {
    return (
      <>
        <div
          className="
            rounded-3xl border border-slate-200
            bg-white p-8 text-center
            text-slate-600 shadow-sm
          "
        >
          No se pudo mostrar la ficha de la participante.
        </div>

        <ErrorModal
          open={errorModal.open}
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => {
            cerrarErrorModal();
            navigate("/participantes");
          }}
        />
      </>
    );
  }

  const fotoPublica = obtenerUrlFoto(participante.foto_perfil_path);

  const fotoUrl =
    fotoPublica && photoVersion
      ? `${fotoPublica}?v=${photoVersion}`
      : fotoPublica;

  const mostrarFoto = Boolean(fotoUrl) && !imageError;

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div
        className="
          flex flex-col gap-3
          sm:flex-row sm:items-center
          sm:justify-between
        "
      >
        <button
          type="button"
          onClick={() => navigate("/participantes")}
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
          "
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        <button
          type="button"
          onClick={solicitarCambioEstado}
          disabled={changingStatus}
          className={`
            flex w-full items-center justify-center
            gap-2 rounded-2xl
            sm:w-auto
            px-4 py-3 font-semibold
            transition-colors
            focus:outline-none focus:ring-4
            disabled:cursor-not-allowed
            disabled:opacity-50
            ${
              participante.estado === "activa"
                ? `
                  bg-red-50 text-red-600
                  hover:bg-red-100
                  focus:ring-red-100
                `
                : `
                  bg-green-50 text-green-700
                  hover:bg-green-100
                  focus:ring-green-100
                `
            }
          `}
        >
          <Ban className="h-4 w-4" />

          {changingStatus
            ? "Guardando..."
            : participante.estado === "activa"
              ? "Dar de baja"
              : "Reactivar"}
        </button>
      </div>

      <Card className="p-4 sm:p-6">
        <div
          className="
            flex flex-col gap-6
            xl:flex-row xl:items-start
            xl:justify-between
          "
        >
          <div
            className="
              flex flex-col items-center gap-4
              sm:flex-row sm:items-center sm:gap-5
            "
          >
            <div className="relative shrink-0">
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => void subirFotoPerfil(event)}
                className="hidden"
              />

              <button
                type="button"
                title={
                  participante.foto_perfil_path
                    ? "Cambiar foto de perfil"
                    : "Agregar foto de perfil"
                }
                aria-label={
                  participante.foto_perfil_path
                    ? "Cambiar foto de perfil"
                    : "Agregar foto de perfil"
                }
                disabled={uploadingPhoto}
                onClick={() => fotoInputRef.current?.click()}
                className="
                  group relative block
                  h-28 w-28 cursor-pointer
                  sm:h-30 sm:w-30
                  rounded-full
                  focus:outline-none
                  focus:ring-4
                  focus:ring-pink-200
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <div
                  className="
                    absolute left-0 top-0
                    h-26 w-26
                    sm:h-28 sm:w-28
                    overflow-hidden rounded-full
                    border-4 border-white
                    bg-pink-100
                    shadow-md ring-1
                    ring-slate-200
                    transition
                    group-hover:scale-[1.02]
                    group-hover:ring-pink-300
                  "
                >
                  <img
                    src={
                      mostrarFoto
                        ? (fotoUrl ?? undefined)
                        : "/placeholder_person.png"
                    }
                    alt={
                      mostrarFoto
                        ? `Foto de ${participante.nombre} ${participante.apellido}`
                        : "Foto de perfil sin cargar"
                    }
                    onError={() => {
                      if (mostrarFoto) {
                        setImageError(true);
                      }
                    }}
                    className="
                      h-full w-full
                      object-cover
                    "
                  />

                  <div
                    className="
                      absolute inset-0
                      bg-slate-900/0
                      transition-colors
                      group-hover:bg-slate-900/10
                    "
                  />

                  {uploadingPhoto && (
                    <div
                      className="
                        absolute inset-0
                        flex items-center
                        justify-center
                        bg-slate-900/55
                        text-white
                      "
                    >
                      <LoaderCircle
                        className="
                          h-8 w-8
                          animate-spin
                        "
                      />
                    </div>
                  )}
                </div>

                <div
                  className="
                    absolute bottom-1 right-1
                    z-10
                    flex h-10 w-10
                    items-center justify-center
                    rounded-full border-4
                    border-white
                    bg-pink-600
                    text-white
                    shadow-md
                    transition-colors
                    group-hover:bg-pink-700
                  "
                >
                  {uploadingPhoto ? (
                    <LoaderCircle
                      className="
                        h-4 w-4
                        animate-spin
                      "
                    />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                </div>
              </button>
            </div>

            <div className="text-center sm:text-left">
              <div
                className="
                  flex flex-wrap items-center
                  justify-center gap-3
                  sm:justify-start
                "
              >
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {participante.nombre} {participante.apellido}
                </h1>

                <span
                  className={`
                    rounded-full px-3 py-1
                    text-xs font-semibold
                    ${
                      participante.estado === "activa"
                        ? `
                          bg-green-100
                          text-green-700
                        `
                        : `
                          bg-slate-200
                          text-slate-600
                        `
                    }
                  `}
                >
                  {participante.estado === "activa" ? "Activa" : "Baja"}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                CI: {FormatHelper.mostrarCedula(participante.ci)} ·{" "}
                {participante.tipo_participante}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                JPG, PNG o WEBP · máximo 5 MB
              </p>
            </div>
          </div>

          <div
            className="
              grid w-full grid-cols-1 gap-3
              sm:grid-cols-3 xl:w-auto
            "
          >
            <Mini
              label="Último pago"
              value={
                pagos[0] ? formatearFecha(pagos[0].fecha_pago) : "Sin registrar"
              }
              icon={<Wallet className="h-5 w-5" />}
              iconTitle="Último pago registrado"
            />

            <Mini
              label="Última asistencia"
              value={
                asistencias[0]
                  ? formatearFechaHora(asistencias[0].fecha)
                  : "Sin registrar"
              }
              icon={<CalendarCheck className="h-5 w-5" />}
              iconTitle="Última asistencia registrada"
            />

            <Mini
              label="Ingreso"
              value={formatearFecha(participante.fecha_ingreso)}
              icon={<CalendarDays className="h-5 w-5" />}
              iconTitle="Fecha de ingreso"
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-2">
        <div
          className="
            flex gap-2 overflow-x-auto
            overscroll-x-contain pb-1
            lg:grid lg:grid-cols-4
            lg:overflow-visible lg:pb-0
          "
        >
          {(
            [
              [
                "datos",
                "Datos",
                <User className="h-4 w-4" />,
                "Ver datos de la participante",
              ],
              [
                "pagos",
                "Pagos",
                <Wallet className="h-4 w-4" />,
                "Ver historial de pagos",
              ],
              [
                "asistencias",
                "Asistencias",
                <CalendarCheck className="h-4 w-4" />,
                "Ver historial de asistencias",
              ],
              [
                "archivos",
                "Archivos",
                <FileText className="h-4 w-4" />,
                "Ver archivos adjuntos",
              ],
            ] as [Tab, string, ReactNode, string][]
          ).map(([key, label, icon, iconTitle]) => (
            <button
              type="button"
              key={key}
              title={iconTitle}
              aria-label={iconTitle}
              onClick={() =>
                setSearchParams({
                  tab: key,
                })
              }
              className={`
                  flex shrink-0 items-center
                  justify-center gap-2
                  rounded-2xl px-4 py-3
                  text-sm sm:text-base
                  lg:w-full
                  font-semibold
                  transition-colors
                  focus:outline-none
                  focus:ring-4
                  focus:ring-pink-100
                  ${
                    tab === key
                      ? `
                        bg-pink-100
                        text-pink-700
                      `
                      : `
                        text-slate-500
                        hover:bg-slate-50
                        hover:text-slate-800
                      `
                  }
                `}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </Card>

      {tab === "datos" && (
        <div
          className="
            grid grid-cols-1 gap-6
            xl:grid-cols-2
          "
        >
          <EditableInfoCard
            cardId="datos-personales"
            title="Datos personales"
            description="Identificación y datos de contacto."
            icon={<User className="h-5 w-5" />}
            iconTitle="Datos personales"
            participante={participante}
            fields={[
              {
                key: "nombre",
                label: "Nombre",
                placeholder: "Nombre",
              },
              {
                key: "apellido",
                label: "Apellido",
                placeholder: "Apellido",
              },
              {
                key: "ci",
                label: "Cédula",
                type: "cedula",
                placeholder: "1.234.567-8",
              },
              {
                key: "telefono",
                label: "Teléfono",
                placeholder: "Teléfono",
              },
              {
                key: "telefono_alternativo",
                label: "Teléfono alternativo",
                placeholder: "Teléfono alternativo",
              },
              {
                key: "email",
                label: "Email",
                type: "email",
                placeholder: "Email",
              },
              {
                key: "direccion",
                label: "Dirección",
                placeholder: "Dirección",
              },
              {
                key: "ocupacion",
                label: "Ocupación",
                placeholder: "Ocupación",
              },
            ]}
            saving={savingCard === "datos-personales"}
            onSave={async (values) =>
              guardarParticipante("datos-personales", {
                nombre: values.nombre.trim(),

                apellido: values.apellido.trim(),

                ci: FormatHelper.limpiarCedula(values.ci),

                telefono: cleanTextValue(values.telefono),

                telefono_alternativo: cleanTextValue(
                  values.telefono_alternativo,
                ),

                email: cleanTextValue(values.email),

                direccion: cleanTextValue(values.direccion),

                ocupacion: cleanTextValue(values.ocupacion),
              })
            }
          />

          <EditableInfoCard
            cardId="datos-administrativos"
            title="Datos administrativos"
            description="Tipo de ficha, estado e ingreso."
            icon={<ClipboardList className="h-5 w-5" />}
            iconTitle="Datos administrativos"
            participante={participante}
            fields={[
              {
                key: "tipo_participante",
                label: "Tipo",
                type: "select",
                options: [
                  {
                    label: "Fundación",
                    value: "fundacion",
                  },
                  {
                    label: "Escuela",
                    value: "escuela",
                  },
                ],
              },
              {
                key: "estado",
                label: "Estado",
                type: "select",
                options: [
                  {
                    label: "Activa",
                    value: "activa",
                  },
                  {
                    label: "Baja",
                    value: "baja",
                  },
                ],
              },
              {
                key: "fecha_ingreso",
                label: "Fecha de ingreso",
                type: "date",
              },
            ]}
            saving={savingCard === "datos-administrativos"}
            onSave={async (values) =>
              guardarParticipante("datos-administrativos", {
                tipo_participante: values.tipo_participante,

                estado: values.estado,

                fecha_ingreso: values.fecha_ingreso,
              })
            }
          />

          <EditableInfoCard
            cardId="informacion-salud"
            title="Información de salud"
            description="Prestador, emergencia y cirugía."
            icon={<HeartPulse className="h-5 w-5" />}
            iconTitle="Información de salud"
            participante={participante}
            fields={[
              {
                key: "prestador_salud",
                label: "Prestador",
                placeholder: "Prestador de salud",
              },
              {
                key: "emergencia_movil",
                label: "Emergencia móvil",
                placeholder: "Emergencia móvil",
              },
              {
                key: "fecha_cirugia",
                label: "Fecha cirugía",
                type: "date",
              },
              {
                key: "tipo_cirugia",
                label: "Tipo cirugía",
                placeholder: "Tipo de cirugía",
              },
            ]}
            saving={savingCard === "informacion-salud"}
            onSave={async (values) =>
              guardarParticipante("informacion-salud", {
                prestador_salud: cleanTextValue(values.prestador_salud),

                emergencia_movil: cleanTextValue(values.emergencia_movil),

                fecha_cirugia:
                  values.fecha_cirugia === "" ? null : values.fecha_cirugia,

                tipo_cirugia: cleanTextValue(values.tipo_cirugia),
              })
            }
          />

          <EditableInfoCard
            cardId="antecedentes-valoracion"
            title="Antecedentes y valoración"
            description="Condiciones médicas y linfedema."
            icon={<Activity className="h-5 w-5" />}
            iconTitle="Antecedentes y valoración"
            participante={participante}
            fields={[
              {
                key: "hta",
                label: "HTA",
                type: "select",
                options: opcionesBooleanas,
              },
              {
                key: "diabetes",
                label: "Diabetes",
                type: "select",
                options: opcionesBooleanas,
              },
              {
                key: "alergias",
                label: "Alergias",
                type: "textarea",
                placeholder: "Alergias",
              },
              {
                key: "otros_antecedentes",
                label: "Otros antecedentes",
                type: "textarea",
                placeholder: "Otros antecedentes",
              },
              {
                key: "desarrolla_linfedema",
                label: "Desarrolla linfedema",
                type: "select",
                options: opcionesBooleanas,
              },
              {
                key: "miembro_afectado",
                label: "Miembro afectado",
                type: "select",
                options: [
                  {
                    label: "Sin registrar",
                    value: "",
                  },
                  {
                    label: "Derecho",
                    value: "derecho",
                  },
                  {
                    label: "Izquierdo",
                    value: "izquierdo",
                  },
                  {
                    label: "Ambos",
                    value: "ambos",
                  },
                ],
              },
              {
                key: "observaciones",
                label: "Observaciones",
                type: "textarea",
                placeholder: "Observaciones",
              },
            ]}
            saving={savingCard === "antecedentes-valoracion"}
            onSave={async (values) =>
              guardarParticipante("antecedentes-valoracion", {
                hta: values.hta === "" ? null : values.hta === "true",

                diabetes:
                  values.diabetes === "" ? null : values.diabetes === "true",

                alergias: cleanTextValue(values.alergias),

                otros_antecedentes: cleanTextValue(values.otros_antecedentes),

                desarrolla_linfedema:
                  values.desarrolla_linfedema === ""
                    ? null
                    : values.desarrolla_linfedema === "true",

                miembro_afectado: cleanTextValue(values.miembro_afectado),

                observaciones: cleanTextValue(values.observaciones),
              })
            }
          />
        </div>
      )}

      {tab === "pagos" && (
        <Table
          headers={["Mes", "Fecha de pago", "Monto", "Observaciones"]}
          rows={pagos.map((pago) => [
            `${meses[pago.mes_abonado - 1]} ${pago.anio_abonado}`,

            formatearFecha(pago.fecha_pago),

            pago.monto == null
              ? "Sin registrar"
              : `$${Number(pago.monto).toLocaleString("es-US")}`,

            pago.observaciones || "Sin observaciones",
          ])}
        />
      )}

      {tab === "asistencias" && (
        <Table
          headers={[
            "Fecha",
            "Hora registrada",
            "Horario de clase",
            "Observaciones",
          ]}
          rows={asistencias.map((asistencia) => [
            formatearFecha(asistencia.fecha),

            formatearHora(asistencia.fecha),

            formatearHorario(
              asistencia.hora_inicio_snapshot,
              asistencia.hora_fin_snapshot,
            ),

            asistencia.observaciones || "Sin observaciones",
          ])}
        />
      )}

      {tab === "archivos" && id && (
        <ArchivosParticipante
          idParticipante={id}
          archivos={archivos}
          onChange={setArchivos}
        />
      )}

      <ConfirmationModal
        open={confirmationModal.open}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        variant={confirmationModal.variant}
        loading={changingStatus}
        onCancel={cerrarConfirmationModal}
        onConfirm={() => void cambiarEstadoParticipante()}
      />

      <ErrorModal
        open={errorModal.open}
        title={errorModal.title}
        message={errorModal.message}
        onClose={cerrarErrorModal}
      />

      <Snackbar
        open={snackbar.open}
        type={snackbar.type}
        message={snackbar.message}
        onClose={cerrarSnackbar}
      />
    </div>
  );
}

function Mini({
  label,
  value,
  icon,
  iconTitle,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  iconTitle: string;
}) {
  return (
    <div
      className="
        flex min-w-0
        items-center gap-3
        sm:min-w-[180px]
        rounded-2xl border
        border-slate-200
        bg-[#F5F9FF] px-4 py-3
      "
    >
      <div
        title={iconTitle}
        aria-label={iconTitle}
        className="
          flex h-10 w-10 shrink-0
          items-center justify-center
          rounded-xl bg-white
          text-pink-600 shadow-sm
        "
      >
        {icon}
      </div>

      <div>
        <p
          className="
            text-xs font-semibold
            uppercase tracking-wide
            text-slate-400
          "
        >
          {label}
        </p>

        <p className="mt-1 font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function EditableInfoCard({
  cardId,
  title,
  description,
  icon,
  iconTitle,
  participante,
  fields,
  saving,
  onSave,
}: {
  cardId: string;
  title: string;
  description: string;
  icon: ReactNode;
  iconTitle: string;
  participante: Participante;
  fields: EditableField[];
  saving: boolean;
  onSave: (values: EditableValues) => Promise<boolean>;
}) {
  const initialValues = participanteToEditableValues(participante, fields);

  const [values, setValues] = useState<EditableValues>(initialValues);

  const [savedValues, setSavedValues] = useState<EditableValues>(initialValues);

  useEffect(() => {
    const nextValues = participanteToEditableValues(participante, fields);

    setValues(nextValues);
    setSavedValues(nextValues);
  }, [participante, cardId]);

  const hasChanges = !areValuesEqual(savedValues, values);

  const cedulaInvalida = fields.some(
    (field) =>
      field.type === "cedula" &&
      !FormatHelper.cedulaCompleta(values[field.key] ?? ""),
  );

  const handleChange = (key: keyof Participante, value: string) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (cedulaInvalida || saving) {
      return;
    }

    const saved = await onSave(values);

    if (saved) {
      const nextSavedValues = {
        ...values,
      };

      fields.forEach((field) => {
        if (field.type === "cedula") {
          nextSavedValues[field.key] = FormatHelper.formatearCedula(
            values[field.key] ?? "",
          );
        }
      });

      setSavedValues(nextSavedValues);
      setValues(nextSavedValues);
    }
  };

  return (
    <Card className="overflow-hidden p-0">
      <div
        className="
            flex items-center gap-3
            border-b border-slate-200
            bg-[#FFF5FE] px-5 py-4
          "
      >
        <div
          title={iconTitle}
          aria-label={iconTitle}
          className="
              flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-xl bg-white
              text-pink-600 shadow-sm
            "
        >
          {icon}
        </div>

        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>

          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-4">
          {fields.map((field) => (
            <EditableInput
              key={field.key}
              field={field}
              value={values[field.key] ?? ""}
              onChange={(value) => handleChange(field.key, value)}
            />
          ))}
        </div>

        {hasChanges && (
          <div className="mt-6 flex justify-stretch sm:justify-end">
            <button
              type="button"
              disabled={saving || cedulaInvalida}
              onClick={() => void handleSave()}
              className="
                  flex w-full items-center justify-center gap-2
                  rounded-2xl bg-pink-600
                  sm:w-auto
                  px-5 py-3 font-semibold
                  text-white shadow-sm
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
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

function EditableInput({
  field,
  value,
  onChange,
}: {
  field: EditableField;
  value: string;
  onChange: (value: string) => void;
}) {
  const cedulaConContenido =
    field.type === "cedula" && FormatHelper.limpiarCedula(value).length > 0;

  const cedulaInvalida =
    field.type === "cedula" &&
    cedulaConContenido &&
    !FormatHelper.cedulaCompleta(value);

  const baseClassName = `
    mt-2 w-full rounded-2xl
    border border-slate-300
    bg-[#F5F9FF] px-4 py-3
    text-sm text-slate-900
    shadow-sm outline-none
    transition-colors
    placeholder:text-slate-400
    hover:border-slate-400
    focus:border-pink-400
    focus:bg-white
    focus:ring-4
    focus:ring-pink-100
  `;

  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {field.label}
      </span>

      {field.type === "textarea" ? (
        <textarea
          value={value}
          rows={3}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${baseClassName} resize-y`}
        />
      ) : field.type === "select" ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={baseClassName}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "cedula" ? (
        <>
          <input
            type="text"
            value={value}
            inputMode="numeric"
            autoComplete="off"
            maxLength={11}
            placeholder={field.placeholder ?? "1.234.567-8"}
            aria-invalid={cedulaInvalida}
            onChange={(event) => {
              onChange(FormatHelper.formatearCedula(event.target.value));
            }}
            className={`
              ${baseClassName}
              ${
                cedulaInvalida
                  ? `
                    border-red-400
                    focus:border-red-400
                    focus:ring-red-100
                  `
                  : ""
              }
            `}
          />

          {cedulaInvalida && (
            <span
              className="
                mt-2 block text-xs
                font-medium text-red-600
              "
            >
              La cédula debe contener 8 números.
            </span>
          )}
        </>
      ) : (
        <input
          type={field.type ?? "text"}
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={baseClassName}
        />
      )}
    </label>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {rows.length === 0 ? (
          <Card className="p-4 text-center text-sm text-slate-500">
            No hay registros.
          </Card>
        ) : (
          rows.map((row, rowIndex) => (
            <Card key={rowIndex} className="p-4">
              <div className="flex flex-col gap-3">
                {row.map((cell, cellIndex) => (
                  <div
                    key={cellIndex}
                    className="
                      flex items-start justify-between gap-4
                      border-b border-slate-100 pb-3
                      last:border-b-0 last:pb-0
                    "
                  >
                    <span
                      className="
                        shrink-0 text-xs font-semibold
                        uppercase tracking-wide
                        text-slate-400
                      "
                    >
                      {headers[cellIndex]}
                    </span>

                    <span className="min-w-0 text-right text-sm font-medium text-slate-700">
                      {cell}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>

      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr
                className="
                  border-b border-slate-200
                  bg-[#F5F9FF] text-left
                "
              >
                {headers.map((header) => (
                  <th
                    key={header}
                    className="
                      whitespace-nowrap
                      px-6 py-4 text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="
                      px-6 py-12
                      text-center text-sm
                      text-slate-500
                    "
                  >
                    No hay registros.
                  </td>
                </tr>
              ) : (
                rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="
                      border-b border-slate-100
                      transition-colors
                      last:border-b-0
                      hover:bg-[#FFF5F9]
                    "
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="
                          whitespace-nowrap
                          px-6 py-5
                          text-slate-600
                        "
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function ConfirmationModal({
  open,
  title,
  message,
  confirmText,
  variant,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  variant: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) {
    return null;
  }

  const esPeligroso = variant === "danger";

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
        aria-labelledby="confirmation-modal-title"
        aria-describedby="confirmation-modal-message"
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
                  : "bg-pink-100 text-pink-700"
              }
            `}
          >
            {esPeligroso ? (
              <AlertTriangle className="h-7 w-7" />
            ) : (
              <Save className="h-7 w-7" />
            )}
          </div>

          <h2
            id="confirmation-modal-title"
            className="
              mt-4 text-lg font-bold
              sm:mt-5 sm:text-xl
              text-slate-900
            "
          >
            {title}
          </h2>

          <p
            id="confirmation-modal-message"
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
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              rounded-2xl border
              border-slate-300 bg-white
              px-5 py-3 font-semibold
              text-slate-700 transition
              hover:bg-slate-100
              focus:outline-none
              focus:ring-4
              focus:ring-slate-200
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            autoFocus
            className={`
              flex items-center
              justify-center gap-2
              rounded-2xl px-5 py-3
              font-semibold text-white
              shadow-sm transition
              focus:outline-none
              focus:ring-4
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
              ${
                esPeligroso
                  ? `
                    bg-red-600
                    hover:bg-red-700
                    focus:ring-red-200
                  `
                  : `
                    bg-pink-600
                    hover:bg-pink-700
                    focus:ring-pink-200
                  `
              }
            `}
          >
            {loading && <LoaderCircle className="h-5 w-5 animate-spin" />}

            {loading ? "Procesando..." : confirmText}
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
        aria-labelledby="error-modal-title"
        aria-describedby="error-modal-message"
        className="
          max-h-[90dvh] w-full overflow-y-auto
          sm:max-w-md
          rounded-3xl border border-slate-200
          bg-white shadow-2xl
        "
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div
              className="
                flex h-14 w-14 shrink-0
                items-center justify-center
                rounded-2xl bg-red-100
                text-red-700
              "
            >
              <AlertTriangle className="h-7 w-7" />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="
                rounded-full p-2
                text-slate-400 transition
                hover:bg-slate-100
                hover:text-slate-700
                focus:outline-none
                focus:ring-4
                focus:ring-slate-100
              "
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h2
            id="error-modal-title"
            className="mt-5 text-xl font-bold text-slate-900"
          >
            {title}
          </h2>

          <p
            id="error-modal-message"
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
              w-full rounded-2xl bg-red-600
              px-6 py-3
              sm:w-auto font-semibold
              text-white shadow-sm transition
              hover:bg-red-700
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
  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(onClose, 3500);

    return () => window.clearTimeout(timeout);
  }, [open, message, onClose]);

  if (!open) {
    return null;
  }

  const esError = type === "error";

  return (
    <div
      role="status"
      aria-live="polite"
      className="
        fixed bottom-3 left-3 right-3 z-[170]
        flex w-auto max-w-none
        sm:bottom-6 sm:left-auto sm:right-6
        sm:w-[calc(100%-3rem)] sm:max-w-md
        items-start gap-3 rounded-2xl
        border bg-white p-4 shadow-2xl
        sm:w-full
      "
    >
      <div
        className={`
          flex h-9 w-9 shrink-0
          items-center justify-center rounded-xl
          ${esError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}
        `}
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
  );
}
