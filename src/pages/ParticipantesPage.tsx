import { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";

export default function ParticipantesPage() {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      <div
        className={`
          flex flex-col gap-6 transition-all duration-300
          ${showForm ? "-translate-x-[34%] opacity-40" : "translate-x-0 opacity-100"}
        `}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Participantes</h1>

            <p className="mt-2 text-slate-500">
              Gestión de participantes
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="
              rounded-2xl bg-pink-600 px-5 py-3
              font-semibold text-white
              transition hover:bg-pink-700
            "
          >
            Nueva participante
          </button>
        </div>

        <Card className="overflow-hidden p-0">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                  Nombre
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                  CI
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                  Teléfono
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                  Estado
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                  Último pago
                </th>
              </tr>
            </thead>

            <tbody>
              {[1, 2, 3, 4, 5].map((item) => (
                <tr
                  key={item}
                  onClick={() => navigate("/participantes/1")}
                  className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-6 py-5 font-medium">
                    María González
                  </td>

                  <td className="px-6 py-5 text-slate-600">
                    4.123.456-7
                  </td>

                  <td className="px-6 py-5 text-slate-600">
                    099 123 456
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Activa
                    </span>
                  </td>

                  <td className="px-6 py-5 text-slate-600">
                    10/05/2026
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div
        className={`
          fixed right-0 top-0 z-50 h-screen w-[720px]
          border-l border-slate-200 bg-white shadow-2xl
          transition-transform duration-300
          ${showForm ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Nueva participante
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Cargar ficha personal
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
            <Section title="Tipo de ficha">
              <Select label="Tipo de participante">
                <option value="fundacion">Fundación</option>
                <option value="escuela">Escuela</option>
              </Select>

              <Input label="Fecha de ingreso" type="date" />
            </Section>

            <Section title="Datos personales">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre" />
                <Input label="Apellido" />
                <Input label="Cédula" />
                <Input label="Fecha de nacimiento" type="date" />
                <Input label="Teléfono" />
                <Input label="Teléfono alternativo" />
              </div>

              <Input label="Dirección" />
              <Input label="Email" type="email" />
              <Input label="Ocupación" />
            </Section>

            <Section title="Información de salud">
              <Input label="Prestador de salud" />
              <Input label="Emergencia móvil" />
              <Input label="Fecha de cirugía" type="date" />
              <Input label="Tipo de cirugía" />
            </Section>

            <Section title="Antecedentes personales">
              <div className="grid grid-cols-2 gap-4">
                <Checkbox label="HTA" />
                <Checkbox label="Diabetes" />
              </div>

              <Textarea label="Alergias" />
              <Textarea label="Otros antecedentes" />
            </Section>

            <Section title="Valoración de linfedema">
              <Select label="Desarrolla linfedema">
                <option value="">Seleccionar</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </Select>

              <Select label="Miembro superior afectado">
                <option value="">Seleccionar</option>
                <option value="derecho">Derecho</option>
                <option value="izquierdo">Izquierdo</option>
                <option value="ambos">Ambos</option>
              </Select>

              <Textarea label="Observaciones" />
            </Section>

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
                className="rounded-2xl bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700"
              >
                Guardar participante
              </button>
            </div>
          </form>
        </div>
      </div>
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
      <h3 className="mb-4 text-lg font-bold text-slate-900">
        {title}
      </h3>

      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Input({
  label,
  type = "text",
}: {
  label: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-600">
        {label}
      </span>

      <input
        type={type}
        className="
          rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3
          outline-none transition
          focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100
        "
      />
    </label>
  );
}

function Textarea({ label }: { label: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-600">
        {label}
      </span>

      <textarea
        rows={3}
        className="
          resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3
          outline-none transition
          focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100
        "
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
      <span className="text-sm font-semibold text-slate-600">
        {label}
      </span>

      <select
        className="
          rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3
          outline-none transition
          focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100
        "
      >
        {children}
      </select>
    </label>
  );
}

function Checkbox({ label }: { label: string }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <input
        type="checkbox"
        className="h-4 w-4 accent-pink-600"
      />

      <span className="font-medium text-slate-700">{label}</span>
    </label>
  );
}