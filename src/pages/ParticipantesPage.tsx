import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";

import NuevaParticipantePanel, {
  crearFormularioInicial,
  type NuevaParticipanteForm,
} from "../components/participantes/NuevaParticipantePanel";

import { supabase } from "../services/supabase";
import FormatHelper from "../helpers/FormatHelper";

type Participante = {
  id: string;
  foto_perfil_path: string | null;
  tipo_participante: "fundacion" | "escuela";
  nombre: string;
  apellido: string;
  ci: string;
  fecha_nacimiento: string | null;
  direccion: string | null;
  telefono: string | null;
  telefono_alternativo: string | null;
  email: string | null;
  ocupacion: string | null;
  prestador_salud: string | null;
  emergencia_movil: string | null;
  fecha_cirugia: string | null;
  tipo_cirugia: string | null;
  hta: boolean | null;
  diabetes: boolean | null;
  alergias: string | null;
  otros_antecedentes: string | null;
  desarrolla_linfedema: boolean | null;
  miembro_afectado: "derecho" | "izquierdo" | "ambos" | null;
  observaciones: string | null;
  estado: "activa" | "baja";
  fecha_ingreso: string;
  ultimo_pago?:
    | {
        fecha_pago: string | null;
      }[]
    | null;
};

type SortKey = "nombre" | "ci" | "telefono" | "estado" | "ultimo_pago";

type SortDirection = "asc" | "desc";

type FeedbackModalState = {
  open: boolean;
  type: "success" | "error";
  title: string;
  message: string;
};

const FOTO_BUCKET = "fotos-participantes";

const PLACEHOLDER_FOTO = "/placeholder_person.png";

const MODAL_INICIAL: FeedbackModalState = {
  open: false,
  type: "success",
  title: "",
  message: "",
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Sin registrar";
  }

  return new Intl.DateTimeFormat("es-UY").format(new Date(`${value}T00:00:00`));
};

function obtenerMensajeError(error: unknown, mensajePredeterminado: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return mensajePredeterminado;
}

export default function ParticipantesPage() {
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);

  const [participantes, setParticipantes] = useState<Participante[]>([]);

  const [busqueda, setBusqueda] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState("");

  const [feedbackModal, setFeedbackModal] =
    useState<FeedbackModalState>(MODAL_INICIAL);

  const [form, setForm] = useState<NuevaParticipanteForm>(
    crearFormularioInicial,
  );

  const [sortKey, setSortKey] = useState<SortKey>("nombre");

  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const mostrarError = (title: string, message: string) => {
    setFeedbackModal({
      open: true,
      type: "error",
      title,
      message,
    });
  };

  const mostrarExito = (title: string, message: string) => {
    setFeedbackModal({
      open: true,
      type: "success",
      title,
      message,
    });
  };

  const cerrarFeedbackModal = () => {
    setFeedbackModal(MODAL_INICIAL);
  };

  const cargarParticipantes = async (): Promise<boolean> => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("participantes")
        .select(
          `
              id,
              foto_perfil_path,
              tipo_participante,
              nombre,
              apellido,
              ci,
              fecha_nacimiento,
              direccion,
              telefono,
              telefono_alternativo,
              email,
              ocupacion,
              prestador_salud,
              emergencia_movil,
              fecha_cirugia,
              tipo_cirugia,
              hta,
              diabetes,
              alergias,
              otros_antecedentes,
              desarrolla_linfedema,
              miembro_afectado,
              observaciones,
              estado,
              fecha_ingreso,
              ultimo_pago:v_ultimo_pago_participante(fecha_pago)
            `,
        )
        .order("apellido", {
          ascending: true,
        })
        .order("nombre", {
          ascending: true,
        });

      if (error) {
        setParticipantes([]);

        mostrarError(
          "No se pudieron cargar las participantes",
          error.message || "Ocurrió un error al consultar las participantes.",
        );

        return false;
      }

      setParticipantes((data ?? []) as Participante[]);

      return true;
    } catch (error) {
      setParticipantes([]);

      mostrarError(
        "No se pudieron cargar las participantes",
        obtenerMensajeError(
          error,
          "Ocurrió un error inesperado al consultar las participantes.",
        ),
      );

      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarParticipantes();
  }, []);

  const participantesFiltradas = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    const resultado = participantes.filter((participante) => {
      if (!textoBusqueda) {
        return true;
      }

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
        busqueda,
      );

      return coincideTexto || coincideCedula;
    });

    return [...resultado].sort((a, b) => {
      let valorA = "";
      let valorB = "";

      switch (sortKey) {
        case "nombre":
          valorA = `${a.nombre} ${a.apellido}`;

          valorB = `${b.nombre} ${b.apellido}`;
          break;

        case "ci":
          valorA = a.ci;
          valorB = b.ci;
          break;

        case "telefono":
          valorA = a.telefono ?? "";
          valorB = b.telefono ?? "";
          break;

        case "estado":
          valorA = a.estado;
          valorB = b.estado;
          break;

        case "ultimo_pago":
          valorA = a.ultimo_pago?.[0]?.fecha_pago ?? "";

          valorB = b.ultimo_pago?.[0]?.fecha_pago ?? "";
          break;
      }

      const comparacion = valorA.localeCompare(valorB, "es", {
        numeric: true,
        sensitivity: "base",
      });

      return sortDirection === "asc" ? comparacion : -comparacion;
    });
  }, [busqueda, participantes, sortDirection, sortKey]);

  const cambiarOrden = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((currentDirection) =>
        currentDirection === "asc" ? "desc" : "asc",
      );

      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  };

  const abrirFormulario = () => {
    setFormError("");
    setForm(crearFormularioInicial());
    setShowForm(true);
  };

  const cerrarFormulario = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setFormError("");
  };

  const guardarParticipante = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = {
        tipo_participante: form.tipo_participante,

        fecha_ingreso: form.fecha_ingreso,

        nombre: form.nombre.trim(),

        apellido: form.apellido.trim(),

        ci: FormatHelper.limpiarCedula(form.ci),

        fecha_nacimiento: form.fecha_nacimiento || null,

        telefono: form.telefono.trim() || null,

        telefono_alternativo: form.telefono_alternativo.trim() || null,

        direccion: form.direccion.trim() || null,

        email: form.email.trim() || null,

        ocupacion: form.ocupacion.trim() || null,

        prestador_salud: form.prestador_salud.trim() || null,

        emergencia_movil: form.emergencia_movil.trim() || null,

        fecha_cirugia: form.fecha_cirugia || null,

        tipo_cirugia: form.tipo_cirugia.trim() || null,

        hta: form.hta,

        diabetes: form.diabetes,

        alergias: form.alergias.trim() || null,

        otros_antecedentes: form.otros_antecedentes.trim() || null,

        desarrolla_linfedema:
          form.desarrolla_linfedema === ""
            ? null
            : form.desarrolla_linfedema === "true",

        miembro_afectado: form.miembro_afectado || null,

        observaciones: form.observaciones.trim() || null,
      };

      const { error } = await supabase.from("participantes").insert(payload);

      if (error) {
        setFormError(
          error.code === "23505"
            ? "Ya existe una participante con esa cédula."
            : error.message || "No se pudo guardar la participante.",
        );

        return;
      }

      const nombreCompleto =
        `${form.nombre.trim()} ${form.apellido.trim()}`.trim();

      setForm(crearFormularioInicial());
      setShowForm(false);

      const cargaCorrecta = await cargarParticipantes();

      if (!cargaCorrecta) {
        return;
      }

      mostrarExito(
        "Participante registrada",
        nombreCompleto
          ? `${nombreCompleto} fue registrada correctamente.`
          : "La participante fue registrada correctamente.",
      );
    } catch (error) {
      setFormError(
        obtenerMensajeError(
          error,
          "Ocurrió un error inesperado al guardar la participante.",
        ),
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
          transition-all duration-300
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
            <h1
              className="
                text-2xl font-bold
                text-slate-900
                sm:text-3xl
              "
            >
              Participantes
            </h1>

            <p className="mt-1 text-sm text-slate-500 sm:mt-2 sm:text-base">
              Gestión de participantes
            </p>
          </div>

          <button
            type="button"
            onClick={abrirFormulario}
            disabled={loading}
            className="
              w-full rounded-2xl bg-pink-600
              px-5 py-3 font-semibold
              sm:w-auto
              text-white shadow-sm
              transition hover:bg-pink-700
              focus:outline-none
              focus:ring-4
              focus:ring-pink-200
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Nueva participante
          </button>
        </div>

        <div className="flex flex-col gap-3 md:hidden">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-slate-700">
              {participantes.length} participantes registradas
            </p>

            <div
              className="
                flex items-center gap-3
                rounded-2xl border
                border-slate-300
                bg-[#F5F9FF]
                px-4 py-3 shadow-sm
                transition
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
                placeholder="Buscar por nombre, CI o teléfono..."
                className="
                  w-full min-w-0 bg-transparent
                  text-sm text-slate-900 outline-none
                  placeholder:text-slate-400
                "
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <MobileSortButton
                label="Nombre"
                sortKey="nombre"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={cambiarOrden}
              />

              <MobileSortButton
                label="Último pago"
                sortKey="ultimo_pago"
                activeSortKey={sortKey}
                direction={sortDirection}
                onSort={cambiarOrden}
              />
            </div>
          </div>

          {loading ? (
            <Card className="p-4 text-sm text-slate-500">
              Cargando participantes...
            </Card>
          ) : participantesFiltradas.length === 0 ? (
            <Card className="p-4 text-center text-sm text-slate-500">
              No se encontraron participantes.
            </Card>
          ) : (
            participantesFiltradas.map((participante) => (
              <button
                type="button"
                key={participante.id}
                onClick={() => navigate(`/participantes/${participante.id}`)}
                className="
                  w-full rounded-3xl border
                  border-slate-200 bg-white
                  p-4 text-left shadow-sm
                  transition
                  hover:bg-[#FFF5F9]
                  focus:outline-none
                  focus:ring-4
                  focus:ring-pink-100
                "
              >
                <div className="flex items-start gap-3">
                  <FotoParticipante
                    path={participante.foto_perfil_path}
                    nombre={`${participante.nombre} ${participante.apellido}`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {participante.nombre} {participante.apellido}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          CI: {FormatHelper.mostrarCedula(participante.ci)}
                        </p>
                      </div>

                      <span
                        className={`
                          shrink-0 rounded-full
                          px-2.5 py-1 text-[11px]
                          font-semibold
                          ${
                            participante.estado === "activa"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }
                        `}
                      >
                        {participante.estado === "activa" ? "Activa" : "Baja"}
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
                          Teléfono
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                          {participante.telefono || "Sin registrar"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Último pago
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatDate(
                            participante.ultimo_pago?.[0]?.fecha_pago,
                          )}
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
              <p
                className="
                font-semibold
                text-slate-700
              "
              >
                {participantes.length} participantes registradas
              </p>

              <div
                className="
                flex items-center gap-3
                rounded-2xl border
                border-slate-300
                bg-[#F5F9FF]
                px-4 py-3 shadow-sm
                transition
                focus-within:border-pink-400
                focus-within:bg-white
                focus-within:ring-4
                focus-within:ring-pink-100
              "
              >
                <Search
                  className="
                  h-4 w-4 shrink-0
                  text-slate-500
                "
                />

                <input
                  type="search"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar por nombre, CI o teléfono..."
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
              <table
                className="
                w-full border-collapse
              "
              >
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

                    <SortableHeader
                      label="Nombre"
                      sortKey="nombre"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={cambiarOrden}
                    />

                    <SortableHeader
                      label="CI"
                      sortKey="ci"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={cambiarOrden}
                    />

                    <SortableHeader
                      label="Teléfono"
                      sortKey="telefono"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={cambiarOrden}
                    />

                    <SortableHeader
                      label="Estado"
                      sortKey="estado"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={cambiarOrden}
                    />

                    <SortableHeader
                      label="Último pago"
                      sortKey="ultimo_pago"
                      activeSortKey={sortKey}
                      direction={sortDirection}
                      onSort={cambiarOrden}
                    />
                  </tr>
                </thead>

                <tbody>
                  {!loading &&
                    participantesFiltradas.map((participante) => (
                      <tr
                        key={participante.id}
                        onClick={() =>
                          navigate(`/participantes/${participante.id}`)
                        }
                        className="
                          cursor-pointer
                          border-b
                          border-slate-100
                          transition
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
                            path={participante.foto_perfil_path}
                            nombre={`${participante.nombre} ${participante.apellido}`}
                          />
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                            font-medium
                            text-slate-900
                          "
                        >
                          {participante.nombre} {participante.apellido}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                            text-slate-600
                          "
                        >
                          {FormatHelper.mostrarCedula(participante.ci)}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                            text-slate-600
                          "
                        >
                          {participante.telefono || "Sin registrar"}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                          "
                        >
                          <span
                            className={`
                              rounded-full
                              px-3 py-1
                              text-xs
                              font-semibold
                              ${
                                participante.estado === "activa"
                                  ? `
                                    bg-green-100
                                    text-green-700
                                  `
                                  : `
                                    bg-slate-100
                                    text-slate-600
                                  `
                              }
                            `}
                          >
                            {participante.estado === "activa"
                              ? "Activa"
                              : "Baja"}
                          </span>
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-6 py-5
                            text-slate-600
                          "
                        >
                          {formatDate(
                            participante.ultimo_pago?.[0]?.fecha_pago,
                          )}
                        </td>
                      </tr>
                    ))}

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
                        Cargando participantes...
                      </td>
                    </tr>
                  )}

                  {!loading && participantesFiltradas.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="
                          px-6 py-12
                          text-center
                          text-slate-500
                        "
                      >
                        No se encontraron participantes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <NuevaParticipantePanel
        open={showForm}
        form={form}
        saving={saving}
        error={formError}
        onChange={setForm}
        onClose={cerrarFormulario}
        onSubmit={guardarParticipante}
      />

      <FeedbackModal
        open={feedbackModal.open}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onClose={cerrarFeedbackModal}
      />
    </div>
  );
}

function FeedbackModal({
  open,
  type,
  title,
  message,
  onClose,
}: {
  open: boolean;
  type: "success" | "error";
  title: string;
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
        fixed inset-0 z-[120]
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
        aria-labelledby="feedback-modal-title"
        aria-describedby="feedback-modal-description"
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
              className={`
                flex h-14 w-14 shrink-0
                items-center justify-center
                rounded-2xl
                ${
                  esError
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700"
                }
              `}
            >
              {esError ? (
                <AlertTriangle className="h-7 w-7" />
              ) : (
                <CheckCircle2 className="h-7 w-7" />
              )}
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
            id="feedback-modal-title"
            className="
              mt-5 text-xl font-bold
              text-slate-900
            "
          >
            {title}
          </h2>

          <p
            id="feedback-modal-description"
            className="
              mt-2 whitespace-pre-line
              text-sm leading-6
              text-slate-600
            "
          >
            {message}
          </p>
        </div>

        <div
          className="
            flex justify-end
            border-t border-slate-200
            bg-slate-50 px-5 py-4
            sm:px-6 sm:py-5
          "
        >
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className={`
              w-full rounded-2xl px-6 py-3
              sm:w-auto
              font-semibold text-white
              shadow-sm transition
              focus:outline-none
              focus:ring-4
              ${
                esError
                  ? `
                    bg-red-600
                    hover:bg-red-700
                    focus:ring-red-200
                  `
                  : `
                    bg-emerald-600
                    hover:bg-emerald-700
                    focus:ring-emerald-200
                  `
              }
            `}
          >
            {esError ? "Entendido" : "Aceptar"}
          </button>
        </div>
      </div>
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
        overflow-hidden
        rounded-full
        border-2 border-white
        bg-pink-50
        shadow-sm
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

function MobileSortButton({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeSortKey === sortKey;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`
        flex items-center justify-center gap-2
        rounded-2xl border px-3 py-2.5
        text-xs font-semibold transition
        focus:outline-none focus:ring-4
        focus:ring-pink-100
        ${
          isActive
            ? "border-pink-200 bg-pink-50 text-pink-700"
            : "border-slate-200 bg-white text-slate-600"
        }
      `}
    >
      <span>{label}</span>

      {isActive ? (
        direction === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="h-4 w-4 text-slate-400" />
      )}
    </button>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeSortKey === sortKey;

  return (
    <th className="px-6 py-4">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="
          group flex w-full
          items-center gap-2
          whitespace-nowrap
          text-left text-sm
          font-semibold
          text-slate-700
          transition
          hover:text-pink-700
        "
        aria-label={`Ordenar por ${label}`}
      >
        <span>{label}</span>

        {isActive ? (
          direction === "asc" ? (
            <ArrowUp
              className="
                h-4 w-4
                text-pink-600
              "
            />
          ) : (
            <ArrowDown
              className="
                h-4 w-4
                text-pink-600
              "
            />
          )
        ) : (
          <ArrowUpDown
            className="
              h-4 w-4
              text-slate-400
              transition
              group-hover:text-pink-500
            "
          />
        )}
      </button>
    </th>
  );
}
