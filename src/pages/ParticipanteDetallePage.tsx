import type { ReactNode } from "react";
import {
  ArrowLeft,
  User,
  Wallet,
  CalendarCheck,
  FileText,
  Edit3,
  Ban,
  Upload,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import Card from "../components/ui/Card";

const participanteMock = {
  id: "1",
  nombre: "María",
  apellido: "González",
  ci: "4.123.456-7",
  telefono: "099 123 456",
  telefonoAlternativo: "098 555 555",
  email: "maria@email.com",
  direccion: "Av. Italia 1234",
  ocupacion: "Docente",
  tipoParticipante: "Fundación",
  estado: "activa",
  fechaIngreso: "16/05/2026",

  prestadorSalud: "ASSE",
  emergenciaMovil: "UCM",
  fechaCirugia: "10/02/2025",
  tipoCirugia: "Mastectomía",
  hta: true,
  diabetes: false,
  alergias: "Penicilina",
  otrosAntecedentes: "Sin observaciones relevantes",
  desarrollaLinfedema: true,
  miembroAfectado: "Izquierdo",
  observaciones: "Paciente activa, buena asistencia.",
};

const pagosMock = [
  {
    id: 1,
    mes: "Mayo",
    anio: 2026,
    fechaPago: "10/05/2026",
    monto: 1200,
  },
  {
    id: 2,
    mes: "Abril",
    anio: 2026,
    fechaPago: "08/04/2026",
    monto: 1200,
  },
];

const asistenciasMock = [
  {
    id: 1,
    fecha: "16/05/2026",
    horario: "20:00 - 21:30",
    observaciones: "Asistió normalmente",
  },
  {
    id: 2,
    fecha: "14/05/2026",
    horario: "20:00 - 21:30",
    observaciones: "",
  },
];

const archivosMock = [
  {
    id: 1,
    nombre: "Consentimiento informado.pdf",
    tipo: "PDF",
    fecha: "16/05/2026",
  },
  {
    id: 2,
    nombre: "Ficha escaneada.jpg",
    tipo: "Imagen",
    fecha: "16/05/2026",
  },
];

type Tab = "datos" | "pagos" | "asistencias" | "archivos";

const tabsPermitidas: Tab[] = ["datos", "pagos", "asistencias", "archivos"];

function getValidTab(value: string | null): Tab {
  if (value && tabsPermitidas.includes(value as Tab)) {
    return value as Tab;
  }

  return "datos";
}

export default function ParticipanteDetallePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = getValidTab(searchParams.get("tab"));

  const handleTabChange = (nextTab: Tab) => {
    setSearchParams({ tab: nextTab });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/participantes")}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50">
            <Edit3 className="h-4 w-4" />
            Editar ficha
          </button>

          <button className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-100">
            <Ban className="h-4 w-4" />
            Dar de baja
          </button>
        </div>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-pink-100">
              <User className="h-10 w-10 text-pink-600" />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">
                  {participanteMock.nombre} {participanteMock.apellido}
                </h1>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Activa
                </span>
              </div>

              <p className="mt-2 text-slate-500">
                CI: {participanteMock.ci} · {participanteMock.tipoParticipante}
              </p>

              <p className="mt-1 text-sm text-slate-400">ID interno: {id}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Último pago" value="10/05/2026" />
            <MiniStat label="Última asistencia" value="16/05/2026" />
            <MiniStat label="Ingreso" value={participanteMock.fechaIngreso} />
          </div>
        </div>
      </Card>

      <Card className="p-2">
        <div className="flex gap-2">
          <TabButton
            active={tab === "datos"}
            icon={<User className="h-4 w-4" />}
            label="Datos"
            onClick={() => handleTabChange("datos")}
          />

          <TabButton
            active={tab === "pagos"}
            icon={<Wallet className="h-4 w-4" />}
            label="Pagos"
            onClick={() => handleTabChange("pagos")}
          />

          <TabButton
            active={tab === "asistencias"}
            icon={<CalendarCheck className="h-4 w-4" />}
            label="Asistencias"
            onClick={() => handleTabChange("asistencias")}
          />

          <TabButton
            active={tab === "archivos"}
            icon={<FileText className="h-4 w-4" />}
            label="Archivos"
            onClick={() => handleTabChange("archivos")}
          />
        </div>
      </Card>

      {tab === "datos" && <DatosTab />}
      {tab === "pagos" && <PagosTab />}
      {tab === "asistencias" && <AsistenciasTab />}
      {tab === "archivos" && <ArchivosTab />}
    </div>
  );
}

function DatosTab() {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-6">
      <Card>
        <SectionTitle title="Datos personales" />

        <InfoGrid
          items={[
            ["Nombre", participanteMock.nombre],
            ["Apellido", participanteMock.apellido],
            ["Cédula", participanteMock.ci],
            ["Teléfono", participanteMock.telefono],
            ["Teléfono alternativo", participanteMock.telefonoAlternativo],
            ["Email", participanteMock.email],
            ["Dirección", participanteMock.direccion],
            ["Ocupación", participanteMock.ocupacion],
          ]}
        />
      </Card>

      <Card>
        <SectionTitle title="Datos administrativos" />

        <InfoGrid
          items={[
            ["Tipo", participanteMock.tipoParticipante],
            ["Estado", participanteMock.estado],
            ["Fecha de ingreso", participanteMock.fechaIngreso],
          ]}
        />
      </Card>

      <Card>
        <SectionTitle title="Información de salud" />

        <InfoGrid
          items={[
            ["Prestador de salud", participanteMock.prestadorSalud],
            ["Emergencia móvil", participanteMock.emergenciaMovil],
            ["Fecha de cirugía", participanteMock.fechaCirugia],
            ["Tipo de cirugía", participanteMock.tipoCirugia],
          ]}
        />
      </Card>

      <Card>
        <SectionTitle title="Antecedentes y valoración" />

        <InfoGrid
          items={[
            ["HTA", participanteMock.hta ? "Sí" : "No"],
            ["Diabetes", participanteMock.diabetes ? "Sí" : "No"],
            ["Alergias", participanteMock.alergias],
            ["Otros antecedentes", participanteMock.otrosAntecedentes],
            [
              "Desarrolla linfedema",
              participanteMock.desarrollaLinfedema ? "Sí" : "No",
            ],
            ["Miembro afectado", participanteMock.miembroAfectado],
            ["Observaciones", participanteMock.observaciones],
          ]}
        />
      </Card>
    </div>
  );
}

function PagosTab() {
  return (
    <Card className="p-0">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-bold text-slate-900">
          Historial de pagos
        </h2>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left">
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">
              Mes
            </th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">
              Fecha pago
            </th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">
              Monto
            </th>
          </tr>
        </thead>

        <tbody>
          {pagosMock.map((pago) => (
            <tr key={pago.id} className="border-b border-slate-100">
              <td className="px-6 py-5 font-medium">
                {pago.mes} {pago.anio}
              </td>

              <td className="px-6 py-5 text-slate-600">{pago.fechaPago}</td>

              <td className="px-6 py-5 font-semibold text-slate-900">
                ${pago.monto.toLocaleString("es-UY")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function AsistenciasTab() {
  return (
    <Card className="p-0">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-bold text-slate-900">
          Historial de asistencias
        </h2>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left">
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">
              Fecha
            </th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">
              Horario
            </th>
            <th className="px-6 py-4 text-sm font-semibold text-slate-600">
              Observaciones
            </th>
          </tr>
        </thead>

        <tbody>
          {asistenciasMock.map((asistencia) => (
            <tr key={asistencia.id} className="border-b border-slate-100">
              <td className="px-6 py-5 font-medium">{asistencia.fecha}</td>

              <td className="px-6 py-5 text-slate-600">
                {asistencia.horario} hs
              </td>

              <td className="px-6 py-5 text-slate-600">
                {asistencia.observaciones || "Sin observaciones"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function ArchivosTab() {
  return (
    <Card>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Archivos adjuntos
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Consentimientos, fichas escaneadas y documentos.
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-2xl bg-pink-600 px-4 py-3 font-semibold text-white transition hover:bg-pink-700">
          <Upload className="h-4 w-4" />
          Subir archivo
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {archivosMock.map((archivo) => (
          <div
            key={archivo.id}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
              <FileText className="h-6 w-6 text-pink-600" />
            </div>

            <h3 className="font-bold text-slate-900">{archivo.nombre}</h3>

            <p className="mt-2 text-sm text-slate-500">
              {archivo.tipo} · {archivo.fecha}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>

      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3
        font-semibold transition
        ${
          active
            ? "bg-pink-100 text-pink-700"
            : "text-slate-500 hover:bg-slate-50"
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="mb-5 text-xl font-bold text-slate-900">{title}</h2>;
}

function InfoGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
        >
          <p className="text-xs font-semibold uppercase text-slate-400">
            {label}
          </p>

          <p className="mt-1 font-medium text-slate-900">
            {value || "Sin registrar"}
          </p>
        </div>
      ))}
    </div>
  );
}