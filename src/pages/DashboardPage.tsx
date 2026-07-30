import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle, RefreshCcw, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
import FormatHelper from "../helpers/FormatHelper";
import { supabase } from "../services/supabase";

type Participante = {
  id: string;
  nombre: string;
  apellido: string;
  ci: string;
  estado: string;
  fecha_ingreso: string;
};

type Pago = {
  id: string;
  id_participante: string;
  monto: number | null;
  fecha_pago: string;
  mes_abonado: number;
  anio_abonado: number;
  created_at: string;
  participante: {
    id: string;
    nombre: string;
    apellido: string;
  } | null;
};

type ErrorModalState = {
  open: boolean;
  title: string;
  message: string;
};

const ERROR_MODAL_INICIAL: ErrorModalState = {
  open: false,
  title: "",
  message: "",
};

const MESES = [
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

function obtenerFechaLocal(fecha = new Date()) {
  const diferenciaZonaHoraria = fecha.getTimezoneOffset() * 60_000;

  return new Date(fecha.getTime() - diferenciaZonaHoraria)
    .toISOString()
    .slice(0, 10);
}

function obtenerMensajeError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Ocurrió un error inesperado al cargar el resumen del sistema.";
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<Participante[]>([]);

  const [ultimosPagos, setUltimosPagos] = useState<Pago[]>([]);

  const [asistenciasHoy, setAsistenciasHoy] = useState(0);

  const [loading, setLoading] = useState(true);

  const [errorModal, setErrorModal] =
    useState<ErrorModalState>(ERROR_MODAL_INICIAL);

  const cargarDashboard = useCallback(async () => {
    setLoading(true);
    setErrorModal(ERROR_MODAL_INICIAL);

    try {
      const fechaActual = new Date();

      const hoy = obtenerFechaLocal(fechaActual);

      const fechaManana = new Date(fechaActual);

      fechaManana.setDate(fechaManana.getDate() + 1);

      const manana = obtenerFechaLocal(fechaManana);

      const [
        { data: participantesData, error: participantesError },
        { data: pagosData, error: pagosError },
        { count: asistenciasCount, error: asistenciasError },
      ] = await Promise.all([
        supabase
          .from("participantes")
          .select(
            `
                id,
                nombre,
                apellido,
                ci,
                estado,
                fecha_ingreso
              `,
          )
          .order("fecha_ingreso", {
            ascending: false,
          }),

        supabase
          .from("pagos")
          .select(
            `
                id,
                id_participante,
                monto,
                fecha_pago,
                mes_abonado,
                anio_abonado,
                created_at,
                participante:participantes (
                  id,
                  nombre,
                  apellido
                )
              `,
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(6),

        supabase
          .from("asistencias")
          .select("id", {
            count: "exact",
            head: true,
          })
          .gte("fecha", `${hoy}T00:00:00`)
          .lt("fecha", `${manana}T00:00:00`),
      ]);

      const requestError = participantesError || pagosError || asistenciasError;

      if (requestError) {
        throw requestError;
      }

      setRows((participantesData ?? []) as Participante[]);

      setUltimosPagos((pagosData ?? []) as unknown as Pago[]);

      setAsistenciasHoy(asistenciasCount ?? 0);
    } catch (error) {
      setRows([]);
      setUltimosPagos([]);
      setAsistenciasHoy(0);

      setErrorModal({
        open: true,
        title: "No se pudo cargar el dashboard",
        message: obtenerMensajeError(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarDashboard();
  }, [cargarDashboard]);

  const now = new Date();

  const activas = rows.filter(
    (participante) => participante.estado === "activa",
  );

  const nuevos = rows.filter((participante) => {
    const fechaIngreso = new Date(`${participante.fecha_ingreso}T00:00:00`);

    return (
      fechaIngreso.getMonth() === now.getMonth() &&
      fechaIngreso.getFullYear() === now.getFullYear()
    );
  });

  return (
    <>
      <div className="flex flex-col gap-5 sm:gap-6">
        <div>
          <h1
            className="
              text-2xl font-bold
              text-slate-900
              sm:text-3xl
            "
          >
            Dashboard
          </h1>

          <p
            className="
              mt-1 text-sm text-slate-500
              sm:mt-2 sm:text-base
            "
          >
            Resumen general del sistema
          </p>
        </div>

        <div
          className="
            grid grid-cols-2 gap-3
            sm:gap-4
            xl:grid-cols-4 xl:gap-6
          "
        >
          <Stat
            label="Participantes activas"
            value={activas.length}
            loading={loading}
          />

          <Stat
            label="Últimos pagos"
            value={ultimosPagos.length}
            loading={loading}
          />

          <Stat
            label="Asistencias hoy"
            value={asistenciasHoy}
            loading={loading}
          />

          <Stat
            label="Nuevos ingresos"
            value={nuevos.length}
            loading={loading}
          />
        </div>

        <div
          className="
            grid grid-cols-1 gap-5
            sm:gap-6
            xl:grid-cols-[1.2fr_0.8fr]
          "
        >
          <Card className="p-4 sm:p-6">
            <div
              className="
                flex items-center
                justify-between gap-3
              "
            >
              <h3
                className="
                  min-w-0 text-lg
                  font-bold text-slate-900
                  sm:text-xl
                "
              >
                Últimas participantes
              </h3>

              <button
                type="button"
                onClick={() => navigate("/participantes")}
                className="
                  shrink-0 text-sm
                  font-medium text-pink-600
                  transition-colors
                  hover:text-pink-700
                "
              >
                Ver todas
              </button>
            </div>

            <div
              className="
                mt-4 flex flex-col gap-3
                sm:mt-6 sm:gap-4
              "
            >
              {loading ? (
                <LoadingMessage text="Cargando participantes..." />
              ) : rows.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay participantes registradas.
                </p>
              ) : (
                rows.slice(0, 5).map((participante) => (
                  <button
                    type="button"
                    key={participante.id}
                    onClick={() =>
                      navigate(`/participantes/${participante.id}`)
                    }
                    className="
                        flex w-full items-start
                        justify-between gap-3
                        rounded-2xl border
                        border-slate-200
                        p-3 text-left
                        transition-colors
                        hover:bg-slate-50
                        focus:outline-none
                        focus:ring-4
                        focus:ring-pink-100
                        sm:items-center sm:p-4
                      "
                  >
                    <div className="min-w-0">
                      <h4
                        className="
                            truncate text-sm
                            font-semibold
                            text-slate-900
                            sm:text-base
                          "
                      >
                        {participante.nombre} {participante.apellido}
                      </h4>

                      <p
                        className="
                            mt-1 text-xs
                            text-slate-500
                            sm:text-sm
                          "
                      >
                        CI: {FormatHelper.mostrarCedula(participante.ci)}
                      </p>
                    </div>

                    <span
                      className={`
                          shrink-0 rounded-full
                          px-2.5 py-1 text-[11px]
                          font-semibold sm:px-3
                          sm:text-xs
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
                      {participante.estado === "activa" ? "Activa" : "Baja"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div
              className="
                flex items-center
                justify-between gap-3
              "
            >
              <h3
                className="
                  min-w-0 text-lg
                  font-bold text-slate-900
                  sm:text-xl
                "
              >
                Últimos pagos
              </h3>

              <button
                type="button"
                onClick={() => navigate("/pagos")}
                className="
                  shrink-0 text-sm
                  font-medium text-pink-600
                  transition-colors
                  hover:text-pink-700
                "
              >
                Ver todos
              </button>
            </div>

            <div
              className="
                mt-4 flex flex-col gap-3
                sm:mt-6 sm:gap-4
              "
            >
              {loading ? (
                <LoadingMessage text="Cargando pagos..." />
              ) : ultimosPagos.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay pagos registrados.
                </p>
              ) : (
                ultimosPagos.map((pago) => (
                  <button
                    type="button"
                    key={pago.id}
                    onClick={() =>
                      navigate(
                        `/participantes/${pago.id_participante}?tab=pagos`,
                      )
                    }
                    className="
                      w-full rounded-2xl
                      bg-slate-50 p-3
                      text-left transition-colors
                      hover:bg-slate-100
                      focus:outline-none
                      focus:ring-4
                      focus:ring-pink-100
                      sm:p-4
                    "
                  >
                    <div
                      className="
                        flex flex-col gap-3
                        sm:flex-row
                        sm:items-start
                        sm:justify-between
                        sm:gap-4
                      "
                    >
                      <div className="min-w-0">
                        <h4
                          className="
                            truncate text-sm
                            font-semibold
                            text-slate-900
                            sm:text-base
                          "
                        >
                          {pago.participante
                            ? `${pago.participante.nombre} ${pago.participante.apellido}`
                            : "Participante"}
                        </h4>

                        <p
                          className="
                            mt-1 text-xs
                            text-slate-500
                            sm:text-sm
                          "
                        >
                          {MESES[pago.mes_abonado - 1] ?? "Sin mes"}{" "}
                          {pago.anio_abonado}
                        </p>

                        <p
                          className="
                            mt-1 text-[11px]
                            text-slate-400
                            sm:text-xs
                          "
                        >
                          Pagado el{" "}
                          {new Date(
                            `${pago.fecha_pago}T00:00:00`,
                          ).toLocaleDateString("es-UY")}
                        </p>
                      </div>

                      <span
                        className="
                          shrink-0 text-sm
                          font-semibold
                          text-green-600
                          sm:text-base
                        "
                      >
                        {pago.monto !== null
                          ? `$${Number(pago.monto).toLocaleString("es-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : "Sin monto"}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <ErrorModal
        open={errorModal.open}
        title={errorModal.title}
        message={errorModal.message}
        loading={loading}
        onClose={() => setErrorModal(ERROR_MODAL_INICIAL)}
        onRetry={() => void cargarDashboard()}
      />
    </>
  );
}

function LoadingMessage({ text }: { text: string }) {
  return (
    <div
      className="
        flex items-center gap-2
        text-sm text-slate-500
      "
    >
      <LoaderCircle className="h-4 w-4 animate-spin" />
      {text}
    </div>
  );
}

function Stat({
  label,
  value,
  danger = false,
  loading = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <Card className="min-w-0 p-4 sm:p-5 lg:p-6">
      <p
        className="
          min-h-10 text-xs
          font-medium leading-5
          text-slate-500
          sm:min-h-0 sm:text-sm
        "
      >
        {label}
      </p>

      <div className="mt-2 min-h-9 sm:mt-3 sm:min-h-10">
        {loading ? (
          <LoaderCircle
            className="
              h-6 w-6 animate-spin
              text-slate-300
              sm:h-8 sm:w-8
            "
          />
        ) : (
          <h2
            className={`
              text-3xl font-bold
              sm:text-4xl
              ${danger ? "text-red-500" : "text-slate-900"}
            `}
          >
            {value}
          </h2>
        )}
      </div>
    </Card>
  );
}

function ErrorModal({
  open,
  title,
  message,
  loading,
  onClose,
  onRetry,
}: {
  open: boolean;
  title: string;
  message: string;
  loading: boolean;
  onClose: () => void;
  onRetry: () => void;
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
        backdrop-blur-[2px]
        sm:items-center sm:p-4
      "
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-error-title"
        aria-describedby="dashboard-error-message"
        className="
          max-h-[90dvh] w-full
          overflow-y-auto rounded-3xl
          border border-slate-200
          bg-white shadow-2xl
          sm:max-w-md
        "
      >
        <div className="p-5 sm:p-6">
          <div
            className="
              flex items-start
              justify-between gap-4
            "
          >
            <div
              className="
                flex h-12 w-12 shrink-0
                items-center justify-center
                rounded-2xl bg-red-100
                text-red-700
                sm:h-14 sm:w-14
              "
            >
              <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="
                rounded-full p-2
                text-slate-400 transition
                hover:bg-slate-100
                hover:text-slate-700
                focus:outline-none
                focus:ring-4
                focus:ring-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h2
            id="dashboard-error-title"
            className="
              mt-4 text-lg font-bold
              text-slate-900
              sm:mt-5 sm:text-xl
            "
          >
            {title}
          </h2>

          <p
            id="dashboard-error-message"
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
            flex flex-col-reverse gap-3
            border-t border-slate-200
            bg-slate-50 px-5 py-4
            sm:flex-row sm:justify-end
            sm:px-6 sm:py-5
          "
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              w-full rounded-2xl
              border border-slate-300
              bg-white px-5 py-3
              font-semibold text-slate-700
              transition hover:bg-slate-100
              focus:outline-none
              focus:ring-4
              focus:ring-slate-200
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
            "
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            autoFocus
            className="
              flex w-full items-center
              justify-center gap-2
              rounded-2xl bg-pink-600
              px-5 py-3 font-semibold
              text-white shadow-sm
              transition hover:bg-pink-700
              focus:outline-none
              focus:ring-4
              focus:ring-pink-200
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
            "
          >
            {loading ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCcw className="h-5 w-5" />
            )}

            {loading ? "Reintentando..." : "Reintentar"}
          </button>
        </div>
      </div>
    </div>
  );
}
