import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowLeft,
  Ban,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  HeartPulse,
  Save,
  User,
  Wallet,
} from "lucide-react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import ArchivosParticipante, {
  type ArchivoParticipante,
} from "../components/participantes/ArchivosParticipante";

import Card from "../components/ui/Card";
import { supabase } from "../services/supabase";

type Tab =
  | "datos"
  | "pagos"
  | "asistencias"
  | "archivos";

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

type FieldType =
  | "text"
  | "email"
  | "date"
  | "textarea"
  | "select";

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

function formatearFecha(
  value?: string | null,
) {
  if (!value) {
    return "Sin registrar";
  }

  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(
    new Date(
      value.includes("T")
        ? value
        : `${value}T00:00:00`,
    ),
  );
}

function formatearFechaHora(
  value?: string | null,
) {
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

function formatearHora(
  value?: string | null,
) {
  if (!value) {
    return "—";
  }

  if (
    /^\d{2}:\d{2}/.test(value)
  ) {
    return value.slice(0, 5);
  }

  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).format(new Date(value));
}

function formatearHorario(
  inicio?: string | null,
  fin?: string | null,
) {
  const horaInicio = formatearHora(inicio);

  if (horaInicio === "—") {
    return "Sin horario";
  }

  const horaFin = formatearHora(fin);

  return horaFin === "—"
    ? horaInicio
    : `${horaInicio} - ${horaFin}`;
}

const participanteToEditableValues = (
  participante: Participante,
  fields: EditableField[],
): EditableValues => {
  const values: EditableValues = {};

  fields.forEach((field) => {
    const value = participante[field.key];

    if (typeof value === "boolean") {
      values[field.key] = value
        ? "true"
        : "false";

      return;
    }

    values[field.key] =
      value == null ? "" : String(value);
  });

  return values;
};

const areValuesEqual = (
  original: EditableValues,
  current: EditableValues,
) => {
  const keys = new Set([
    ...Object.keys(original),
    ...Object.keys(current),
  ]);

  return [...keys].every(
    (key) =>
      (original[key] ?? "") ===
      (current[key] ?? ""),
  );
};

const cleanTextValue = (value: string) => {
  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
};

export default function ParticipanteDetallePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const rawTab = searchParams.get("tab");

  const tab: Tab = (
    [
      "datos",
      "pagos",
      "asistencias",
      "archivos",
    ].includes(rawTab ?? "")
      ? rawTab
      : "datos"
  ) as Tab;

  const [
    participante,
    setParticipante,
  ] = useState<Participante | null>(null);

  const [pagos, setPagos] = useState<Pago[]>(
    [],
  );

  const [
    asistencias,
    setAsistencias,
  ] = useState<Asistencia[]>([]);

  const [archivos, setArchivos] = useState<
  ArchivoParticipante[]
>([]);

  const [loading, setLoading] =
    useState(true);

  const [savingCard, setSavingCard] =
    useState<string | null>(null);

  const [changingStatus, setChangingStatus] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    void (async () => {
      setLoading(true);
      setError("");

      const [
        {
          data: participanteData,
          error: participanteError,
        },
        {
          data: pagosData,
          error: pagosError,
        },
        {
          data: asistenciasData,
          error: asistenciasError,
        },
        {
          data: archivosData,
          error: archivosError,
        },
      ] = await Promise.all([
        supabase
          .from("participantes")
          .select("*")
          .eq("id", id)
          .single(),

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
        participanteError ||
        pagosError ||
        asistenciasError ||
        archivosError;

      if (requestError) {
        setError(requestError.message);
      } else {
        setParticipante(
          participanteData as Participante,
        );

        setPagos(
          (pagosData ?? []) as Pago[],
        );

        setAsistencias(
          (asistenciasData ??
            []) as Asistencia[],
        );

        setArchivos(
  (archivosData ?? []) as ArchivoParticipante[],
);
      }

      setLoading(false);
    })();
  }, [id]);

  const guardarParticipante = async (
    cardId: string,
    cambios: Partial<Participante>,
  ) => {
    if (!id || !participante) {
      return false;
    }

    setSavingCard(cardId);
    setError("");
    setSuccess("");

    const {
      data,
      error: updateError,
    } = await supabase
      .from("participantes")
      .update(cambios)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
      setSavingCard(null);

      return false;
    }

    setParticipante(data as Participante);

    setSuccess(
      "Los cambios se guardaron correctamente.",
    );

    setSavingCard(null);

    window.setTimeout(() => {
      setSuccess("");
    }, 3000);

    return true;
  };

  const darBaja = async () => {
    if (!id || !participante) {
      return;
    }

    const nuevoEstado =
      participante.estado === "activa"
        ? "baja"
        : "activa";

    const fechaEgreso =
      nuevoEstado === "baja"
        ? new Date()
            .toISOString()
            .slice(0, 10)
        : null;

    setChangingStatus(true);
    setError("");
    setSuccess("");

    const {
      data,
      error: updateError,
    } = await supabase
      .from("participantes")
      .update({
        estado: nuevoEstado,
        fecha_egreso: fechaEgreso,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
      setChangingStatus(false);

      return;
    }

    setParticipante(data as Participante);

    setSuccess(
      nuevoEstado === "baja"
        ? "La participante fue dada de baja."
        : "La participante fue reactivada.",
    );

    setChangingStatus(false);

    window.setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  if (loading) {
    return (
      <div
        className="
          rounded-3xl border border-slate-200
          bg-white p-12 text-center
          text-slate-500 shadow-sm
        "
      >
        Cargando ficha...
      </div>
    );
  }

  if (!participante) {
    return (
      <div
        className="
          rounded-2xl border border-red-200
          bg-red-50 p-4 text-red-700
        "
      >
        {error ||
          "No se encontró la participante."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className="
          flex flex-col gap-3
          sm:flex-row sm:items-center
          sm:justify-between
        "
      >
        <button
          type="button"
          onClick={() =>
            navigate("/participantes")
          }
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
          "
        >
          <ArrowLeft className="h-4 w-4" />

          Volver
        </button>

        <button
          type="button"
          onClick={() => void darBaja()}
          disabled={changingStatus}
          className={`
            flex items-center justify-center
            gap-2 rounded-2xl
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

      {success && (
        <div
          className="
            rounded-2xl border
            border-green-200 bg-green-50
            px-4 py-3 text-sm
            font-medium text-green-700
          "
        >
          {success}
        </div>
      )}

      <Card>
        <div
          className="
            flex flex-col gap-6
            xl:flex-row xl:items-start
            xl:justify-between
          "
        >
          <div className="flex items-center gap-5">
            <div
              title="Participante"
              aria-label="Participante"
              className="
                flex h-20 w-20 shrink-0
                items-center justify-center
                rounded-3xl bg-pink-100
                text-pink-600
              "
            >
              <User className="h-10 w-10" />
            </div>

            <div>
              <div
                className="
                  flex flex-wrap items-center
                  gap-3
                "
              >
                <h1 className="text-3xl font-bold text-slate-900">
                  {participante.nombre}{" "}
                  {participante.apellido}
                </h1>

                <span
                  className={`
                    rounded-full px-3 py-1
                    text-xs font-semibold
                    ${
                      participante.estado ===
                      "activa"
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
                  {participante.estado ===
                  "activa"
                    ? "Activa"
                    : "Baja"}
                </span>
              </div>

              <p className="mt-2 text-slate-500">
                CI: {participante.ci} ·{" "}
                {participante.tipo_participante}
              </p>
            </div>
          </div>

          <div
            className="
              grid grid-cols-1 gap-3
              sm:grid-cols-3
            "
          >
            <Mini
              label="Último pago"
              value={
                pagos[0]
                  ? formatearFecha(
                      pagos[0].fecha_pago,
                    )
                  : "Sin registrar"
              }
              icon={
                <Wallet className="h-5 w-5" />
              }
              iconTitle="Último pago registrado"
            />

            <Mini
              label="Última asistencia"
              value={
                asistencias[0]
                  ? formatearFechaHora(
                      asistencias[0].fecha,
                    )
                  : "Sin registrar"
              }
              icon={
                <CalendarCheck className="h-5 w-5" />
              }
              iconTitle="Última asistencia registrada"
            />

            <Mini
              label="Ingreso"
              value={formatearFecha(
                participante.fecha_ingreso,
              )}
              icon={
                <CalendarDays className="h-5 w-5" />
              }
              iconTitle="Fecha de ingreso"
            />
          </div>
        </div>
      </Card>

      <Card className="p-2">
        <div
          className="
            grid grid-cols-2 gap-2
            lg:grid-cols-4
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
            ] as [
              Tab,
              string,
              ReactNode,
              string,
            ][]
          ).map(
            ([
              key,
              label,
              icon,
              iconTitle,
            ]) => (
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
                  flex items-center
                  justify-center gap-2
                  rounded-2xl px-4 py-3
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
            ),
          )}
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
            icon={
              <User className="h-5 w-5" />
            }
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
                placeholder: "Cédula",
              },
              {
                key: "telefono",
                label: "Teléfono",
                placeholder: "Teléfono",
              },
              {
                key: "telefono_alternativo",
                label: "Teléfono alternativo",
                placeholder:
                  "Teléfono alternativo",
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
            saving={
              savingCard === "datos-personales"
            }
            onSave={async (values) =>
              guardarParticipante(
                "datos-personales",
                {
                  nombre:
                    values.nombre.trim(),
                  apellido:
                    values.apellido.trim(),
                  ci: values.ci.trim(),
                  telefono: cleanTextValue(
                    values.telefono,
                  ),
                  telefono_alternativo:
                    cleanTextValue(
                      values.telefono_alternativo,
                    ),
                  email: cleanTextValue(
                    values.email,
                  ),
                  direccion: cleanTextValue(
                    values.direccion,
                  ),
                  ocupacion: cleanTextValue(
                    values.ocupacion,
                  ),
                },
              )
            }
          />

          <EditableInfoCard
            cardId="datos-administrativos"
            title="Datos administrativos"
            description="Tipo de ficha, estado e ingreso."
            icon={
              <ClipboardList className="h-5 w-5" />
            }
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
            saving={
              savingCard ===
              "datos-administrativos"
            }
            onSave={async (values) =>
              guardarParticipante(
                "datos-administrativos",
                {
                  tipo_participante:
                    values.tipo_participante,
                  estado: values.estado,
                  fecha_ingreso:
                    values.fecha_ingreso,
                },
              )
            }
          />

          <EditableInfoCard
            cardId="informacion-salud"
            title="Información de salud"
            description="Prestador, emergencia y cirugía."
            icon={
              <HeartPulse className="h-5 w-5" />
            }
            iconTitle="Información de salud"
            participante={participante}
            fields={[
              {
                key: "prestador_salud",
                label: "Prestador",
                placeholder:
                  "Prestador de salud",
              },
              {
                key: "emergencia_movil",
                label: "Emergencia móvil",
                placeholder:
                  "Emergencia móvil",
              },
              {
                key: "fecha_cirugia",
                label: "Fecha cirugía",
                type: "date",
              },
              {
                key: "tipo_cirugia",
                label: "Tipo cirugía",
                placeholder:
                  "Tipo de cirugía",
              },
            ]}
            saving={
              savingCard ===
              "informacion-salud"
            }
            onSave={async (values) =>
              guardarParticipante(
                "informacion-salud",
                {
                  prestador_salud:
                    cleanTextValue(
                      values.prestador_salud,
                    ),
                  emergencia_movil:
                    cleanTextValue(
                      values.emergencia_movil,
                    ),
                  fecha_cirugia:
                    values.fecha_cirugia ===
                    ""
                      ? null
                      : values.fecha_cirugia,
                  tipo_cirugia:
                    cleanTextValue(
                      values.tipo_cirugia,
                    ),
                },
              )
            }
          />

          <EditableInfoCard
            cardId="antecedentes-valoracion"
            title="Antecedentes y valoración"
            description="Condiciones médicas y linfedema."
            icon={
              <Activity className="h-5 w-5" />
            }
            iconTitle="Antecedentes y valoración"
            participante={participante}
            fields={[
              {
                key: "hta",
                label: "HTA",
                type: "select",
                options:
                  opcionesBooleanas,
              },
              {
                key: "diabetes",
                label: "Diabetes",
                type: "select",
                options:
                  opcionesBooleanas,
              },
              {
                key: "alergias",
                label: "Alergias",
                type: "textarea",
                placeholder: "Alergias",
              },
              {
                key: "otros_antecedentes",
                label:
                  "Otros antecedentes",
                type: "textarea",
                placeholder:
                  "Otros antecedentes",
              },
              {
                key:
                  "desarrolla_linfedema",
                label:
                  "Desarrolla linfedema",
                type: "select",
                options:
                  opcionesBooleanas,
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
                placeholder:
                  "Observaciones",
              },
            ]}
            saving={
              savingCard ===
              "antecedentes-valoracion"
            }
            onSave={async (values) =>
              guardarParticipante(
                "antecedentes-valoracion",
                {
                  hta:
                    values.hta === ""
                      ? null
                      : values.hta ===
                        "true",
                  diabetes:
                    values.diabetes === ""
                      ? null
                      : values.diabetes ===
                        "true",
                  alergias:
                    cleanTextValue(
                      values.alergias,
                    ),
                  otros_antecedentes:
                    cleanTextValue(
                      values.otros_antecedentes,
                    ),
                  desarrolla_linfedema:
                    values.desarrolla_linfedema ===
                    ""
                      ? null
                      : values.desarrolla_linfedema ===
                        "true",
                  miembro_afectado:
                    cleanTextValue(
                      values.miembro_afectado,
                    ),
                  observaciones:
                    cleanTextValue(
                      values.observaciones,
                    ),
                },
              )
            }
          />
        </div>
      )}

      {tab === "pagos" && (
        <Table
          headers={[
            "Mes",
            "Fecha de pago",
            "Monto",
            "Observaciones",
          ]}
          rows={pagos.map((pago) => [
            `${
              meses[pago.mes_abonado - 1]
            } ${pago.anio_abonado}`,
            formatearFecha(
              pago.fecha_pago,
            ),
            pago.monto == null
              ? "Sin registrar"
              : `$${Number(
                  pago.monto,
                ).toLocaleString("es-US")}`,
            pago.observaciones ||
              "Sin observaciones",
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
          rows={asistencias.map(
            (asistencia) => [
              formatearFecha(
                asistencia.fecha,
              ),
              formatearHora(
                asistencia.fecha,
              ),
              formatearHorario(
                asistencia.hora_inicio_snapshot,
                asistencia.hora_fin_snapshot,
              ),
              asistencia.observaciones ||
                "Sin observaciones",
            ],
          )}
        />
      )}

      {tab === "archivos" && id && (
  <ArchivosParticipante
    idParticipante={id}
    archivos={archivos}
    onChange={setArchivos}
  />
)}
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
        flex min-w-[180px]
        items-center gap-3
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

        <p className="mt-1 font-bold text-slate-900">
          {value}
        </p>
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
  onSave: (
    values: EditableValues,
  ) => Promise<boolean>;
}) {
  const initialValues =
    participanteToEditableValues(
      participante,
      fields,
    );

  const [values, setValues] =
    useState<EditableValues>(
      initialValues,
    );

  const [savedValues, setSavedValues] =
    useState<EditableValues>(
      initialValues,
    );

  useEffect(() => {
    const nextValues =
      participanteToEditableValues(
        participante,
        fields,
      );

    setValues(nextValues);
    setSavedValues(nextValues);
  }, [participante, cardId]);

  const hasChanges = !areValuesEqual(
    savedValues,
    values,
  );

  const handleChange = (
    key: keyof Participante,
    value: string,
  ) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    const saved = await onSave(values);

    if (saved) {
      setSavedValues({
        ...values,
      });
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
          <h2 className="font-bold text-slate-900">
            {title}
          </h2>

          <p className="mt-0.5 text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-4">
          {fields.map((field) => (
            <EditableInput
              key={field.key}
              field={field}
              value={
                values[field.key] ?? ""
              }
              onChange={(value) =>
                handleChange(
                  field.key,
                  value,
                )
              }
            />
          ))}
        </div>

        {hasChanges && (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void handleSave()
              }
              className="
                flex items-center gap-2
                rounded-2xl bg-pink-600
                px-5 py-3 font-semibold
                text-white shadow-sm
                transition-colors
                hover:bg-pink-700
                focus:outline-none
                focus:ring-4
                focus:ring-pink-200
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <Save className="h-4 w-4" />

              {saving
                ? "Guardando..."
                : "Guardar"}
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
          onChange={(event) =>
            onChange(event.target.value)
          }
          className={`${baseClassName} resize-y`}
        />
      ) : field.type === "select" ? (
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className={baseClassName}
        >
          {field.options?.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ),
          )}
        </select>
      ) : (
        <input
          type={field.type ?? "text"}
          value={value}
          placeholder={field.placeholder}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className={baseClassName}
        />
      )}
    </label>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <Card className="overflow-hidden p-0">
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
              rows.map(
                (row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="
                      border-b
                      border-slate-100
                      transition-colors
                      last:border-b-0
                      hover:bg-[#FFF5F9]
                    "
                  >
                    {row.map(
                      (
                        cell,
                        cellIndex,
                      ) => (
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
                      ),
                    )}
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}