import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import NuevaParticipantePanel, {
  crearFormularioInicial,
  type NuevaParticipanteForm,
} from "../components/participantes/NuevaParticipantePanel";
import { supabase } from "../services/supabase";

type Participante = {
  id: string;
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
  ultimo_pago?: {
    fecha_pago: string | null;
  }[] | null;
};

type SortKey =
  | "nombre"
  | "ci"
  | "telefono"
  | "estado"
  | "ultimo_pago";

type SortDirection = "asc" | "desc";

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Sin registrar";
  }

  return new Intl.DateTimeFormat("es-UY").format(
    new Date(`${value}T00:00:00`),
  );
};

export default function ParticipantesPage() {
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState<NuevaParticipanteForm>(
    crearFormularioInicial,
  );

  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  const cargarParticipantes = async () => {
    setLoading(true);
    setPageError("");

    const { data, error } = await supabase
      .from("participantes")
      .select(
        `
          id,
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
      setPageError(error.message);
      setParticipantes([]);
    } else {
      setParticipantes((data ?? []) as Participante[]);
    }

    setLoading(false);
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

      const textoParticipante = [
        participante.nombre,
        participante.apellido,
        participante.ci,
        participante.telefono ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return textoParticipante.includes(textoBusqueda);
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

      return sortDirection === "asc"
        ? comparacion
        : -comparacion;
    });
  }, [
    busqueda,
    participantes,
    sortDirection,
    sortKey,
  ]);

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

  const guardarParticipante = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    const payload = {
      tipo_participante: form.tipo_participante,
      fecha_ingreso: form.fecha_ingreso,
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      ci: form.ci.trim(),
      fecha_nacimiento: form.fecha_nacimiento || null,
      telefono: form.telefono.trim() || null,
      telefono_alternativo:
        form.telefono_alternativo.trim() || null,
      direccion: form.direccion.trim() || null,
      email: form.email.trim() || null,
      ocupacion: form.ocupacion.trim() || null,
      prestador_salud:
        form.prestador_salud.trim() || null,
      emergencia_movil:
        form.emergencia_movil.trim() || null,
      fecha_cirugia: form.fecha_cirugia || null,
      tipo_cirugia: form.tipo_cirugia.trim() || null,
      hta: form.hta,
      diabetes: form.diabetes,
      alergias: form.alergias.trim() || null,
      otros_antecedentes:
        form.otros_antecedentes.trim() || null,
      desarrolla_linfedema:
        form.desarrolla_linfedema === ""
          ? null
          : form.desarrolla_linfedema === "true",
      miembro_afectado: form.miembro_afectado || null,
      observaciones: form.observaciones.trim() || null,
    };

    const { error } = await supabase
      .from("participantes")
      .insert(payload);

    if (error) {
      setFormError(
        error.code === "23505"
          ? "Ya existe una participante con esa cédula."
          : error.message,
      );

      setSaving(false);
      return;
    }

    setForm(crearFormularioInicial());
    setShowForm(false);

    await cargarParticipantes();

    setSaving(false);
  };

  return (
    <div className="relative flex flex-col gap-6">
      <div
        className={`
          flex flex-col gap-6 transition-all duration-300
          ${
            showForm
              ? "pointer-events-none opacity-40"
              : "opacity-100"
          }
        `}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Participantes
            </h1>

            <p className="mt-2 text-slate-500">
              Gestión de participantes
            </p>
          </div>

          <button
            type="button"
            onClick={abrirFormulario}
            className="
              rounded-2xl bg-pink-600 px-5 py-3
              font-semibold text-white shadow-sm
              transition hover:bg-pink-700
              focus:outline-none focus:ring-4 focus:ring-pink-200
            "
          >
            Nueva participante
          </button>
        </div>

        <Card className="overflow-hidden p-0">
          <div
            className="
              flex flex-col gap-4 border-b border-slate-200
              px-6 py-5 md:flex-row md:items-center
              md:justify-between
            "
          >
            <p className="font-semibold text-slate-700">
              {participantes.length} participantes registradas
            </p>

            <div
              className="
                flex items-center gap-3 rounded-2xl
                border border-slate-300 bg-[#F5F9FF]
                px-4 py-3 shadow-sm transition
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
                  setBusqueda(event.target.value)
                }
                placeholder="Buscar por nombre, CI o teléfono..."
                className="
                  w-full min-w-0 bg-transparent text-sm
                  text-slate-900 outline-none
                  placeholder:text-slate-400 md:w-72
                "
              />
            </div>
          </div>

          {pageError && (
            <div
              className="
                m-6 rounded-2xl border border-red-200
                bg-red-50 px-4 py-3 text-sm text-red-700
              "
            >
              {pageError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr
                  className="
                    border-b border-slate-200
                    bg-[#F5F9FF] text-left
                  "
                >
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
                        navigate(
                          `/participantes/${participante.id}`,
                        )
                      }
                      className="
                        cursor-pointer border-b border-slate-100
                        transition hover:bg-[#FFF5F9]
                      "
                    >
                      <td
                        className="
                          whitespace-nowrap px-6 py-5
                          font-medium text-slate-900
                        "
                      >
                        {participante.nombre}{" "}
                        {participante.apellido}
                      </td>

                      <td
                        className="
                          whitespace-nowrap px-6 py-5
                          text-slate-600
                        "
                      >
                        {participante.ci}
                      </td>

                      <td
                        className="
                          whitespace-nowrap px-6 py-5
                          text-slate-600
                        "
                      >
                        {participante.telefono ||
                          "Sin registrar"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-5">
                        <span
                          className={`
                            rounded-full px-3 py-1
                            text-xs font-semibold
                            ${
                              participante.estado === "activa"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-600"
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
                          whitespace-nowrap px-6 py-5
                          text-slate-600
                        "
                      >
                        {formatDate(
                          participante.ultimo_pago?.[0]
                            ?.fecha_pago,
                        )}
                      </td>
                    </tr>
                  ))}

                {loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="
                        px-6 py-12 text-center
                        text-slate-500
                      "
                    >
                      Cargando participantes...
                    </td>
                  </tr>
                )}

                {!loading &&
                  participantesFiltradas.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="
                          px-6 py-12 text-center
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

      <NuevaParticipantePanel
        open={showForm}
        form={form}
        saving={saving}
        error={formError}
        onChange={setForm}
        onClose={cerrarFormulario}
        onSubmit={guardarParticipante}
      />
    </div>
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
          group flex w-full items-center gap-2
          whitespace-nowrap text-left text-sm
          font-semibold text-slate-700
          transition hover:text-pink-700
        "
        aria-label={`Ordenar por ${label}`}
      >
        <span>{label}</span>

        {isActive ? (
          direction === "asc" ? (
            <ArrowUp className="h-4 w-4 text-pink-600" />
          ) : (
            <ArrowDown className="h-4 w-4 text-pink-600" />
          )
        ) : (
          <ArrowUpDown
            className="
              h-4 w-4 text-slate-400
              transition group-hover:text-pink-500
            "
          />
        )}
      </button>
    </th>
  );
}