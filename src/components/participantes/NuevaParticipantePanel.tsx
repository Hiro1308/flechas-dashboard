import {
  X,
  UserPlus,
  UserRound,
  HeartPulse,
  ClipboardPlus,
  Activity,
} from "lucide-react";

import FormatHelper from "../../helpers/FormatHelper";

import type {
  FormEvent,
  ReactNode,
} from "react";

export type NuevaParticipanteForm = {
  tipo_participante: "fundacion" | "escuela";
  fecha_ingreso: string;
  nombre: string;
  apellido: string;
  ci: string;
  fecha_nacimiento: string;
  telefono: string;
  telefono_alternativo: string;
  direccion: string;
  email: string;
  ocupacion: string;
  prestador_salud: string;
  emergencia_movil: string;
  fecha_cirugia: string;
  tipo_cirugia: string;
  hta: boolean;
  diabetes: boolean;
  alergias: string;
  otros_antecedentes: string;
  desarrolla_linfedema: "" | "true" | "false";
  miembro_afectado:
    | ""
    | "derecho"
    | "izquierdo"
    | "ambos";
  observaciones: string;
};

function obtenerFechaLocal() {
  const fecha = new Date();
  const diferenciaZonaHoraria =
    fecha.getTimezoneOffset() * 60_000;

  return new Date(fecha.getTime() - diferenciaZonaHoraria)
    .toISOString()
    .slice(0, 10);
}

export const crearFormularioInicial =
  (): NuevaParticipanteForm => ({
    tipo_participante: "fundacion",
    fecha_ingreso: obtenerFechaLocal(),
    nombre: "",
    apellido: "",
    ci: "",
    fecha_nacimiento: "",
    telefono: "",
    telefono_alternativo: "",
    direccion: "",
    email: "",
    ocupacion: "",
    prestador_salud: "",
    emergencia_movil: "",
    fecha_cirugia: "",
    tipo_cirugia: "",
    hta: false,
    diabetes: false,
    alergias: "",
    otros_antecedentes: "",
    desarrolla_linfedema: "",
    miembro_afectado: "",
    observaciones: "",
  });

type NuevaParticipantePanelProps = {
  open: boolean;
  form: NuevaParticipanteForm;
  saving: boolean;
  error: string;
  onChange: (form: NuevaParticipanteForm) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function NuevaParticipantePanel({
  open,
  form,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: NuevaParticipantePanelProps) {
  const actualizarCampo = <
    Key extends keyof NuevaParticipanteForm,
  >(
    key: Key,
    value: NuevaParticipanteForm[Key],
  ) => {
    onChange({
      ...form,
      [key]: value,
    });
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-40 bg-slate-950/20
          backdrop-blur-[1px] transition-opacity
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
          h-dvh w-full max-w-[760px]
          overflow-hidden
          border-l border-slate-200
          bg-[#FFF5F9] shadow-2xl
          transform-gpu will-change-transform
          transition-transform duration-300 ease-out
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
              flex shrink-0 items-center justify-between
              border-b border-slate-200 bg-white
              px-6 py-5
            "
          >
            <div className="flex items-center gap-4">
              <div
                className="
                  flex h-12 w-12 items-center justify-center
                  rounded-2xl bg-pink-100 text-pink-700
                "
              >
                <UserPlus className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Nueva participante
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Completá la ficha personal y médica.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                rounded-full p-2 text-slate-500
                transition hover:bg-slate-100
                hover:text-slate-900
                focus:outline-none focus:ring-4
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
              flex min-h-0 flex-1 flex-col
              overflow-hidden
            "
          >
            <div
              className="
                flex-1 overflow-y-auto
                px-6 py-6
              "
            >
              <div
                className="
                  mb-6 rounded-2xl border
                  border-pink-200
                  bg-[#FFFBF5]
                  px-4 py-3 text-sm text-slate-600
                "
              >
                Los campos marcados con{" "}
                <span className="font-bold text-red-600">
                  *
                </span>{" "}
                son obligatorios.
              </div>

              <Section
                title="Tipo de ficha"
                description="Información general de ingreso."
                icon={<ClipboardPlus className="h-5 w-5" />}
                background="#F5FFFB"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    required
                    label="Tipo de participante"
                    value={form.tipo_participante}
                    onChange={(value) =>
                      actualizarCampo(
                        "tipo_participante",
                        value as NuevaParticipanteForm["tipo_participante"],
                      )
                    }
                  >
                    <option value="fundacion">
                      Fundación
                    </option>

                    <option value="escuela">
                      Escuela
                    </option>
                  </Select>

                  <Input
                    required
                    label="Fecha de ingreso"
                    type="date"
                    value={form.fecha_ingreso}
                    onChange={(value) =>
                      actualizarCampo(
                        "fecha_ingreso",
                        value,
                      )
                    }
                  />
                </div>
              </Section>

              <Section
                title="Datos personales"
                description="Identificación y medios de contacto."
                icon={<UserRound className="h-5 w-5" />}
                background="#F5FFFB"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    required
                    label="Nombre"
                    value={form.nombre}
                    onChange={(value) =>
                      actualizarCampo("nombre", value)
                    }
                  />

                  <Input
                    required
                    label="Apellido"
                    value={form.apellido}
                    onChange={(value) =>
                      actualizarCampo("apellido", value)
                    }
                  />

                  <CedulaInput
                    required
                    label="Cédula"
                    value={form.ci}
                    onChange={(value) =>
                      actualizarCampo("ci", value)
                    }
                  />

                  <Input
                    label="Fecha de nacimiento"
                    type="date"
                    value={form.fecha_nacimiento}
                    onChange={(value) =>
                      actualizarCampo(
                        "fecha_nacimiento",
                        value,
                      )
                    }
                  />

                  <Input
                    label="Teléfono"
                    type="tel"
                    value={form.telefono}
                    onChange={(value) =>
                      actualizarCampo("telefono", value)
                    }
                  />

                  <Input
                    label="Teléfono alternativo"
                    type="tel"
                    value={form.telefono_alternativo}
                    onChange={(value) =>
                      actualizarCampo(
                        "telefono_alternativo",
                        value,
                      )
                    }
                  />
                </div>

                <Input
                  label="Dirección"
                  value={form.direccion}
                  onChange={(value) =>
                    actualizarCampo("direccion", value)
                  }
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) =>
                      actualizarCampo("email", value)
                    }
                  />

                  <Input
                    label="Ocupación"
                    value={form.ocupacion}
                    onChange={(value) =>
                      actualizarCampo("ocupacion", value)
                    }
                  />
                </div>
              </Section>

              <Section
                title="Información de salud"
                description="Prestador, emergencia y cirugía."
                icon={<HeartPulse className="h-5 w-5" />}
                background="#F5FFFB"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Prestador de salud"
                    value={form.prestador_salud}
                    onChange={(value) =>
                      actualizarCampo(
                        "prestador_salud",
                        value,
                      )
                    }
                  />

                  <Input
                    label="Emergencia móvil"
                    value={form.emergencia_movil}
                    onChange={(value) =>
                      actualizarCampo(
                        "emergencia_movil",
                        value,
                      )
                    }
                  />

                  <Input
                    label="Fecha de cirugía"
                    type="date"
                    value={form.fecha_cirugia}
                    onChange={(value) =>
                      actualizarCampo(
                        "fecha_cirugia",
                        value,
                      )
                    }
                  />

                  <Input
                    label="Tipo de cirugía"
                    value={form.tipo_cirugia}
                    onChange={(value) =>
                      actualizarCampo(
                        "tipo_cirugia",
                        value,
                      )
                    }
                  />
                </div>
              </Section>

              <Section
                title="Antecedentes personales"
                description="Condiciones y antecedentes médicos."
                icon={<ClipboardPlus className="h-5 w-5" />}
                background="#F5FFFB"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Checkbox
                    label="HTA"
                    description="Hipertensión arterial"
                    checked={form.hta}
                    onChange={(value) =>
                      actualizarCampo("hta", value)
                    }
                  />

                  <Checkbox
                    label="Diabetes"
                    description="Antecedente de diabetes"
                    checked={form.diabetes}
                    onChange={(value) =>
                      actualizarCampo(
                        "diabetes",
                        value,
                      )
                    }
                  />
                </div>

                <Textarea
                  label="Alergias"
                  value={form.alergias}
                  onChange={(value) =>
                    actualizarCampo("alergias", value)
                  }
                />

                <Textarea
                  label="Otros antecedentes"
                  value={form.otros_antecedentes}
                  onChange={(value) =>
                    actualizarCampo(
                      "otros_antecedentes",
                      value,
                    )
                  }
                />
              </Section>

              <Section
                title="Valoración de linfedema"
                description="Información sobre la afectación."
                icon={<Activity className="h-5 w-5" />}
                background="#F5FFFB"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    label="Desarrolla linfedema"
                    value={form.desarrolla_linfedema}
                    onChange={(value) =>
                      actualizarCampo(
                        "desarrolla_linfedema",
                        value as NuevaParticipanteForm["desarrolla_linfedema"],
                      )
                    }
                  >
                    <option value="">
                      Seleccionar
                    </option>

                    <option value="true">
                      Sí
                    </option>

                    <option value="false">
                      No
                    </option>
                  </Select>

                  <Select
                    label="Miembro superior afectado"
                    value={form.miembro_afectado}
                    onChange={(value) =>
                      actualizarCampo(
                        "miembro_afectado",
                        value as NuevaParticipanteForm["miembro_afectado"],
                      )
                    }
                  >
                    <option value="">
                      Seleccionar
                    </option>

                    <option value="derecho">
                      Derecho
                    </option>

                    <option value="izquierdo">
                      Izquierdo
                    </option>

                    <option value="ambos">
                      Ambos
                    </option>
                  </Select>
                </div>

                <Textarea
                  label="Observaciones"
                  value={form.observaciones}
                  onChange={(value) =>
                    actualizarCampo(
                      "observaciones",
                      value,
                    )
                  }
                />
              </Section>

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
            </div>

            <footer
              className="
                flex shrink-0 items-center justify-end
                gap-3 border-t border-slate-200
                bg-white px-6 py-5
              "
            >
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="
                  rounded-2xl border border-slate-300
                  bg-white px-5 py-3
                  font-semibold text-slate-700
                  transition hover:bg-slate-50
                  focus:outline-none focus:ring-4
                  focus:ring-slate-100
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="
                  rounded-2xl bg-pink-600
                  px-6 py-3 font-semibold
                  text-white shadow-sm transition
                  hover:bg-pink-700
                  focus:outline-none focus:ring-4
                  focus:ring-pink-200
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {saving
                  ? "Guardando..."
                  : "Guardar participante"}
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
  background,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  background: string;
  children: ReactNode;
}) {
  return (
    <section
      className="
        mb-6 overflow-hidden rounded-3xl
        border border-slate-200 bg-white
        shadow-sm
      "
    >
      <div
        className="
          flex items-center gap-3
          border-b border-slate-200
          px-5 py-4
        "
        style={{
          backgroundColor: background,
        }}
      >
        <div
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-xl bg-white text-pink-600
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
          className="ml-1 font-bold text-red-600"
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
  type = "text",
  value,
  onChange,
  required = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
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
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="
          rounded-2xl border border-slate-300
          bg-[#F5F9FF] px-4 py-3
          text-slate-900 shadow-sm
          outline-none transition
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

function CedulaInput({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const numeros = FormatHelper.limpiarCedula(value);
  const valorFormateado =
    FormatHelper.formatearCedula(value);

  return (
    <label className="flex flex-col gap-2">
      <FieldLabel
        label={label}
        required={required}
      />

      <input
        type="text"
        value={valorFormateado}
        required={required}
        inputMode="numeric"
        autoComplete="off"
        placeholder="1.234.567-8"
        pattern="[0-9]\.[0-9]{3}\.[0-9]{3}-[0-9]"
        title="Ingresá una cédula completa con el formato 1.234.567-8"
        aria-invalid={
          numeros.length > 0 &&
          !FormatHelper.cedulaCompleta(numeros)
        }
        onChange={(event) => {
          const cedulaLimpia =
            FormatHelper.limpiarCedula(event.target.value);

          onChange(cedulaLimpia);
        }}
        onInvalid={(event) => {
          const input = event.currentTarget;

          if (!numeros.length) {
            input.setCustomValidity(
              "La cédula es obligatoria.",
            );
            return;
          }

          input.setCustomValidity(
            "Ingresá los 8 números de la cédula.",
          );
        }}
        onInput={(event) => {
          event.currentTarget.setCustomValidity("");
        }}
        className="
          rounded-2xl border border-slate-300
          bg-[#F5F9FF] px-4 py-3
          text-slate-900 shadow-sm
          outline-none transition
          placeholder:text-slate-400
          hover:border-slate-400
          focus:border-pink-400
          focus:bg-white
          focus:ring-4
          focus:ring-pink-100
          invalid:border-red-400
          invalid:focus:border-red-400
          invalid:focus:ring-red-100
        "
      />

      {numeros.length > 0 && numeros.length < 8 && (
        <span className="text-xs font-medium text-red-600">
          La cédula debe contener 8 números.
        </span>
      )}
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <FieldLabel
        label={label}
        required={required}
      />

      <textarea
        rows={4}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="
          resize-y rounded-2xl
          border border-slate-300
          bg-[#F5F9FF] px-4 py-3
          text-slate-900 shadow-sm
          outline-none transition
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
      <FieldLabel
        label={label}
        required={required}
      />

      <select
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="
          rounded-2xl border border-slate-300
          bg-[#F5F9FF] px-4 py-3
          text-slate-900 shadow-sm
          outline-none transition
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

function Checkbox({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={`
        flex cursor-pointer items-center gap-3
        rounded-2xl border px-4 py-3
        shadow-sm transition
        ${
          checked
            ? "border-pink-300 bg-pink-50"
            : "border-slate-300 bg-[#F5F9FF] hover:border-slate-400"
        }
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="
          h-4 w-4 shrink-0
          accent-pink-600
        "
      />

      <div>
        <p className="font-semibold text-slate-800">
          {label}
        </p>

        <p className="text-xs text-slate-500">
          {description}
        </p>
      </div>
    </label>
  );
}