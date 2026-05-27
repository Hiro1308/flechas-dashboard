import { useState } from "react";
import {
  Search,
  Plus,
  X,
  Wallet,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";

type ParticipanteMock = {
  id: number;
  nombre: string;
  ci: string;
  telefono: string;
};

const participantesMock: ParticipanteMock[] = [
  {
    id: 1,
    nombre: "María González",
    ci: "4.123.456-7",
    telefono: "099 111 222",
  },
  {
    id: 2,
    nombre: "Ana Rodríguez",
    ci: "3.987.654-2",
    telefono: "099 333 444",
  },
  {
    id: 3,
    nombre: "Laura Pérez",
    ci: "5.555.555-5",
    telefono: "099 555 666",
  },
];

const pagosMock = [
  {
    id: 1,
    idParticipante: 1,
    participante: "María González",
    ci: "4.123.456-7",
    mes: "Mayo",
    anio: 2026,
    fechaPago: "10/05/2026",
    monto: 1200,
    estado: "pago",
  },
  {
    id: 2,
    idParticipante: 2,
    participante: "Ana Rodríguez",
    ci: "3.987.654-2",
    mes: "Mayo",
    anio: 2026,
    fechaPago: null,
    monto: 1200,
    estado: "pendiente",
  },
  {
    id: 3,
    idParticipante: 3,
    participante: "Laura Pérez",
    ci: "5.555.555-5",
    mes: "Abril",
    anio: 2026,
    fechaPago: "28/04/2026",
    monto: 1200,
    estado: "pago",
  },
];

const normalizarTexto = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function PagosPage() {
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [busquedaParticipante, setBusquedaParticipante] = useState("");
  const [participanteSeleccionada, setParticipanteSeleccionada] =
    useState<ParticipanteMock | null>(null);
  const [fechaPago, setFechaPago] = useState<Date | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);

  const busquedaNormalizada = normalizarTexto(busquedaParticipante.trim());

  const resultadosParticipantes =
    busquedaNormalizada.length < 2
      ? []
      : participantesMock
          .filter((participante) => {
            const texto = normalizarTexto(
              `${participante.nombre} ${participante.ci} ${participante.telefono}`
            );

            return texto.includes(busquedaNormalizada);
          })
          .slice(0, 3);

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      <div
        className={`
          flex flex-col gap-6 transition-all duration-300
          ${
            showForm
              ? "-translate-x-[34%] opacity-40"
              : "translate-x-0 opacity-100"
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Pagos</h1>

            <p className="mt-2 text-slate-500">
              Control de pagos mensuales de participantes
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-2xl bg-pink-600 px-5 py-3 font-semibold text-white transition hover:bg-pink-700"
          >
            <Plus className="h-5 w-5" />
            Registrar pago
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pagos del mes
                </p>
                <h2 className="mt-3 text-4xl font-bold text-slate-900">24</h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pendientes
                </p>
                <h2 className="mt-3 text-4xl font-bold text-red-500">12</h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Recaudado
                </p>
                <h2 className="mt-3 text-4xl font-bold text-pink-600">
                  $28.800
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100">
                <Wallet className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Historial de pagos
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Pagos registrados y pendientes
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar participante..."
                className="bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                  Participante
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                  CI
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                  Mes
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                  Fecha pago
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                  Monto
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody>
              {pagosMock.map((pago) => (
                <tr
                  key={pago.id}
                  onClick={() =>
                    navigate(`/participantes/${pago.idParticipante}?tab=pagos`)
                  }
                  className="cursor-pointer border-b border-slate-100 transition hover:bg-pink-50"
                >
                  <td className="px-6 py-5 font-semibold text-slate-900">
                    <span className="transition hover:text-pink-600">
                      {pago.participante}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-slate-600">{pago.ci}</td>

                  <td className="px-6 py-5 text-slate-600">
                    {pago.mes} {pago.anio}
                  </td>

                  <td className="px-6 py-5 text-slate-600">
                    {pago.fechaPago ?? "Sin registrar"}
                  </td>

                  <td className="px-6 py-5 font-semibold text-slate-900">
                    ${pago.monto.toLocaleString("es-UY")}
                  </td>

                  <td className="px-6 py-5">
                    {pago.estado === "pago" ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Pago
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                        Pendiente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div
        className={`
          fixed right-0 top-0 z-50 h-screen w-[620px]
          border-l border-slate-200 bg-white shadow-2xl
          transition-transform duration-300
          ${showForm ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Registrar pago
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Cargar un nuevo pago mensual
              </p>
            </div>

            <button
              onClick={() => setShowForm(false)}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form className="flex-1 overflow-y-auto px-6 py-6">
            <Section title="Participante">
              <Input
                label="Buscar por nombre, teléfono o cédula"
                value={busquedaParticipante}
                onChange={(e) => {
                  setBusquedaParticipante(e.target.value);
                  setParticipanteSeleccionada(null);
                }}
              />

              {busquedaParticipante.trim().length > 0 &&
                busquedaParticipante.trim().length < 2 && (
                  <p className="text-sm text-slate-400">
                    Escribí al menos 2 caracteres para buscar.
                  </p>
                )}

              {resultadosParticipantes.length > 0 &&
                !participanteSeleccionada && (
                  <div className="flex flex-col gap-2">
                    {resultadosParticipantes.map((participante) => (
                      <button
                        key={participante.id}
                        type="button"
                        onClick={() => {
                          setParticipanteSeleccionada(participante);
                          setBusquedaParticipante(participante.nombre);
                        }}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-pink-200 hover:bg-pink-50"
                      >
                        <div className="font-semibold text-slate-900">
                          {participante.nombre}
                        </div>

                        <div className="mt-1 text-sm text-slate-500">
                          CI: {participante.ci} · Tel: {participante.telefono}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              {busquedaParticipante.trim().length >= 2 &&
                resultadosParticipantes.length === 0 &&
                !participanteSeleccionada && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No se encontraron participantes con esa búsqueda.
                  </div>
                )}

              {participanteSeleccionada && (
                <div className="rounded-3xl border border-pink-100 bg-pink-50 p-4">
                  <p className="text-sm font-semibold text-pink-700">
                    Participante seleccionada
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {participanteSeleccionada.nombre}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        CI: {participanteSeleccionada.ci} · Tel:{" "}
                        {participanteSeleccionada.telefono}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setParticipanteSeleccionada(null);
                        setBusquedaParticipante("");
                      }}
                      className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-pink-600 transition hover:bg-pink-100"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              )}
            </Section>

            <div
              className={`
                rounded-3xl border p-5 transition
                ${
                  participanteSeleccionada
                    ? "border-transparent bg-white"
                    : "pointer-events-none border-slate-200 bg-slate-100 opacity-50 grayscale"
                }
              `}
            >
              <Section title="Datos del pago">
                <div className="grid grid-cols-2 gap-4">
                  <DatePickerInput
                    label="Fecha de pago"
                    selected={fechaPago}
                    open={showCalendar}
                    onToggle={() => setShowCalendar((value) => !value)}
                    onSelect={(date) => {
                      setFechaPago(date);
                      setShowCalendar(false);
                    }}
                  />

                  <Input label="Monto" type="number" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select label="Mes abonado">
                    <option value="">Seleccionar mes</option>
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </Select>

                  <Input label="Año abonado" type="number" />
                </div>

                <Textarea label="Observaciones" />
              </Section>
            </div>

            {!participanteSeleccionada && (
              <p className="mt-3 text-sm font-medium text-slate-400">
                Seleccioná una participante para habilitar los datos del pago.
              </p>
            )}

            <div className="mt-6 rounded-3xl border border-pink-100 bg-pink-50 p-5">
              <h3 className="font-bold text-pink-700">Información rápida</h3>

              <p className="mt-2 text-sm text-pink-700/80">
                Al registrar el pago, el sistema podrá mostrar automáticamente
                cuándo fue la última vez que la participante abonó.
              </p>
            </div>

            <div className="sticky bottom-0 -mx-6 mt-8 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-5">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!participanteSeleccionada}
                className={`
                  rounded-2xl px-6 py-3 font-semibold text-white transition
                  ${
                    participanteSeleccionada
                      ? "bg-pink-600 hover:bg-pink-700"
                      : "cursor-not-allowed bg-slate-300"
                  }
                `}
              >
                Guardar pago
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function DatePickerInput({
  label,
  selected,
  open,
  onToggle,
  onSelect,
}: {
  label: string;
  selected?: Date;
  open: boolean;
  onToggle: () => void;
  onSelect: (date: Date | undefined) => void;
}) {
  return (
    <div className="relative flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-600">{label}</span>

      <button
        type="button"
        onClick={onToggle}
        className="
          flex items-center justify-between rounded-2xl border border-slate-200
          bg-slate-50 px-4 py-3 text-left outline-none transition
          hover:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-100
        "
      >
        <span className={selected ? "text-slate-900" : "text-slate-400"}>
          {selected
            ? format(selected, "dd/MM/yyyy", { locale: es })
            : "Seleccionar fecha"}
        </span>

        <CalendarDays className="h-5 w-5 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-[86px] z-50 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={onSelect}
            locale={es}
            weekStartsOn={1}
            captionLayout="dropdown"
            classNames={{
              selected: "bg-pink-600 text-white rounded-full",
              today: "text-pink-600 font-bold",
              day: "h-9 w-9 rounded-full hover:bg-pink-50",
              chevron: "fill-pink-600",
            }}
          />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h3 className="mb-4 text-lg font-bold text-slate-900">{title}</h3>

      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Input({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-600">{label}</span>

      <input
        type={type}
        value={value}
        onChange={onChange}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100"
      />
    </label>
  );
}

function Textarea({ label }: { label: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-600">{label}</span>

      <textarea
        rows={3}
        className="resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100"
      />
    </label>
  );
}

function Select({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-600">{label}</span>

      <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100">
        {children}
      </select>
    </label>
  );
}