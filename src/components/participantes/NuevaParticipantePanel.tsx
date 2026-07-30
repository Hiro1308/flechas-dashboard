import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardPlus,
  HeartPulse,
  LoaderCircle,
  Save,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";

import FormatHelper from "../../helpers/FormatHelper";

import { useEffect, useMemo, useRef, useState } from "react";

import type { FormEvent, ReactNode } from "react";

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
  miembro_afectado: "" | "derecho" | "izquierdo" | "ambos";
  observaciones: string;
};

function obtenerFechaLocal() {
  const fecha = new Date();
  const diferenciaZonaHoraria = fecha.getTimezoneOffset() * 60_000;

  return new Date(fecha.getTime() - diferenciaZonaHoraria)
    .toISOString()
    .slice(0, 10);
}

export const crearFormularioInicial = (): NuevaParticipanteForm => ({
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
  success?: string;
  onChange: (form: NuevaParticipanteForm) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

type ModalType = "confirm-save" | "confirm-close" | "error" | "success" | null;

export default function NuevaParticipantePanel({
  open,
  form,
  saving,
  error,
  success = "",
  onChange,
  onClose,
  onSubmit,
}: NuevaParticipantePanelProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const permitirEnvioRef = useRef(false);

  const [modalActivo, setModalActivo] = useState<ModalType>(null);

  const [errorDescartado, setErrorDescartado] = useState("");

  const [successDescartado, setSuccessDescartado] = useState("");

  const formularioInicial = useMemo(() => crearFormularioInicial(), [open]);

  const tieneCambios = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(formularioInicial);
  }, [form, formularioInicial]);

  useEffect(() => {
    if (error && error !== errorDescartado) {
      setModalActivo("error");
    }
  }, [error, errorDescartado]);

  useEffect(() => {
    if (success && success !== successDescartado) {
      setModalActivo("success");
    }
  }, [success, successDescartado]);

  useEffect(() => {
    if (!open) {
      setModalActivo(null);
      permitirEnvioRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!saving && modalActivo === "confirm-save") {
      setModalActivo(null);
    }
  }, [saving, modalActivo]);

  const actualizarCampo = <Key extends keyof NuevaParticipanteForm>(
    key: Key,
    value: NuevaParticipanteForm[Key],
  ) => {
    onChange({
      ...form,
      [key]: value,
    });
  };

  const solicitarCierre = () => {
    if (saving) {
      return;
    }

    if (tieneCambios) {
      setModalActivo("confirm-close");
      return;
    }

    onClose();
  };

  const manejarSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (permitirEnvioRef.current) {
      permitirEnvioRef.current = false;
      onSubmit(event);
      return;
    }

    event.preventDefault();

    const formulario = event.currentTarget;

    if (!formulario.checkValidity()) {
      formulario.reportValidity();
      return;
    }

    setModalActivo("confirm-save");
  };

  const confirmarGuardado = () => {
    if (saving) {
      return;
    }

    setModalActivo(null);
    permitirEnvioRef.current = true;
    formRef.current?.requestSubmit();
  };

  const confirmarCierre = () => {
    if (saving) {
      return;
    }

    setModalActivo(null);
    onClose();
  };

  const cerrarModalError = () => {
    setErrorDescartado(error);
    setModalActivo(null);
  };

  const cerrarModalSuccess = () => {
    setSuccessDescartado(success);
    setModalActivo(null);
  };

  return (
    <>
      <div
        onClick={solicitarCierre}
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
          h-dvh w-full max-w-none
          overflow-hidden
          sm:max-w-[760px]
          border-l border-slate-200
          bg-[#FFF5F9] shadow-2xl
          transform-gpu will-change-transform
          transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col">
          <header
            className="
              flex shrink-0 items-center justify-between
              gap-3 border-b border-slate-200 bg-white
              px-4 py-4
              sm:px-6 sm:py-5
            "
          >
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div
                className="
                  flex h-10 w-10 shrink-0 items-center justify-center
                  sm:h-12 sm:w-12
                  rounded-2xl bg-pink-100 text-pink-700
                "
              >
                <UserPlus className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Nueva participante
                </h2>

                <p className="mt-1 hidden text-sm text-slate-500 sm:block">
                  Completá la ficha personal y médica.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={solicitarCierre}
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
            ref={formRef}
            onSubmit={manejarSubmit}
            className="
              flex min-h-0 flex-1 flex-col
              overflow-hidden
            "
          >
            <div
              className="
                flex-1 overflow-y-auto
                px-4 py-4
                sm:px-6 sm:py-6
              "
            >
              <div
                className="
                  mb-4 rounded-2xl border
                  border-pink-200
                  bg-[#FFFBF5]
                  px-4 py-3 text-xs text-slate-600
                  sm:mb-6 sm:text-sm
                "
              >
                Los campos marcados con{" "}
                <span className="font-bold text-red-600">*</span> son
                obligatorios.
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
                    <option value="fundacion">Fundación</option>

                    <option value="escuela">Escuela</option>
                  </Select>

                  <Input
                    required
                    label="Fecha de ingreso"
                    type="date"
                    value={form.fecha_ingreso}
                    onChange={(value) =>
                      actualizarCampo("fecha_ingreso", value)
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
                    onChange={(value) => actualizarCampo("nombre", value)}
                  />

                  <Input
                    required
                    label="Apellido"
                    value={form.apellido}
                    onChange={(value) => actualizarCampo("apellido", value)}
                  />

                  <CedulaInput
                    required
                    label="Cédula"
                    value={form.ci}
                    onChange={(value) => actualizarCampo("ci", value)}
                  />

                  <Input
                    label="Fecha de nacimiento"
                    type="date"
                    value={form.fecha_nacimiento}
                    onChange={(value) =>
                      actualizarCampo("fecha_nacimiento", value)
                    }
                  />

                  <Input
                    label="Teléfono"
                    type="tel"
                    value={form.telefono}
                    onChange={(value) => actualizarCampo("telefono", value)}
                  />

                  <Input
                    label="Teléfono alternativo"
                    type="tel"
                    value={form.telefono_alternativo}
                    onChange={(value) =>
                      actualizarCampo("telefono_alternativo", value)
                    }
                  />
                </div>

                <Input
                  label="Dirección"
                  value={form.direccion}
                  onChange={(value) => actualizarCampo("direccion", value)}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) => actualizarCampo("email", value)}
                  />

                  <Input
                    label="Ocupación"
                    value={form.ocupacion}
                    onChange={(value) => actualizarCampo("ocupacion", value)}
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
                      actualizarCampo("prestador_salud", value)
                    }
                  />

                  <Input
                    label="Emergencia móvil"
                    value={form.emergencia_movil}
                    onChange={(value) =>
                      actualizarCampo("emergencia_movil", value)
                    }
                  />

                  <Input
                    label="Fecha de cirugía"
                    type="date"
                    value={form.fecha_cirugia}
                    onChange={(value) =>
                      actualizarCampo("fecha_cirugia", value)
                    }
                  />

                  <Input
                    label="Tipo de cirugía"
                    value={form.tipo_cirugia}
                    onChange={(value) => actualizarCampo("tipo_cirugia", value)}
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
                    onChange={(value) => actualizarCampo("hta", value)}
                  />

                  <Checkbox
                    label="Diabetes"
                    description="Antecedente de diabetes"
                    checked={form.diabetes}
                    onChange={(value) => actualizarCampo("diabetes", value)}
                  />
                </div>

                <Textarea
                  label="Alergias"
                  value={form.alergias}
                  onChange={(value) => actualizarCampo("alergias", value)}
                />

                <Textarea
                  label="Otros antecedentes"
                  value={form.otros_antecedentes}
                  onChange={(value) =>
                    actualizarCampo("otros_antecedentes", value)
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
                    <option value="">Seleccionar</option>

                    <option value="true">Sí</option>

                    <option value="false">No</option>
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
                    <option value="">Seleccionar</option>

                    <option value="derecho">Derecho</option>

                    <option value="izquierdo">Izquierdo</option>

                    <option value="ambos">Ambos</option>
                  </Select>
                </div>

                <Textarea
                  label="Observaciones"
                  value={form.observaciones}
                  onChange={(value) => actualizarCampo("observaciones", value)}
                />
              </Section>
            </div>

            <footer
              className="
                flex shrink-0 flex-col-reverse
                items-stretch gap-3
                border-t border-slate-200
                bg-white px-4 py-4
                sm:flex-row sm:items-center
                sm:justify-end sm:px-6 sm:py-5
              "
            >
              <button
                type="button"
                onClick={solicitarCierre}
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
                  sm:w-auto
                "
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="
                  flex items-center justify-center gap-2
                  rounded-2xl bg-pink-600
                  px-6 py-3 font-semibold
                  text-white shadow-sm transition
                  hover:bg-pink-700
                  focus:outline-none focus:ring-4
                  focus:ring-pink-200
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:w-auto
                "
              >
                {saving ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Guardar participante
                  </>
                )}
              </button>
            </footer>
          </form>
        </div>
      </aside>

      <ConfirmationModal
        open={modalActivo === "confirm-save"}
        title="Guardar participante"
        description={
          <>
            ¿Confirmás que querés registrar a{" "}
            <strong className="font-bold text-slate-900">
              {`${form.nombre.trim()} ${form.apellido.trim()}`.trim() ||
                "esta participante"}
            </strong>
            ?
          </>
        }
        confirmText="Sí, guardar"
        cancelText="Volver al formulario"
        variant="primary"
        loading={saving}
        icon={<Save className="h-6 w-6" />}
        onConfirm={confirmarGuardado}
        onCancel={() => setModalActivo(null)}
      />

      <ConfirmationModal
        open={modalActivo === "confirm-close"}
        title="Descartar cambios"
        description={
          <>
            Hay información cargada que todavía no fue guardada. Si cerrás el
            formulario, vas a perder todos esos cambios.
          </>
        }
        confirmText="Descartar cambios"
        cancelText="Seguir editando"
        variant="danger"
        icon={<AlertTriangle className="h-6 w-6" />}
        onConfirm={confirmarCierre}
        onCancel={() => setModalActivo(null)}
      />

      <MessageModal
        open={modalActivo === "error"}
        title="No se pudo completar la operación"
        message={
          error || "Ocurrió un error inesperado al guardar la participante."
        }
        buttonText="Entendido"
        variant="error"
        onClose={cerrarModalError}
      />

      <MessageModal
        open={modalActivo === "success"}
        title="Participante guardada"
        message={success || "La participante fue registrada correctamente."}
        buttonText="Aceptar"
        variant="success"
        onClose={cerrarModalSuccess}
      />
    </>
  );
}

function ModalContainer({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-[100]
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
        className="
          max-h-[90dvh] w-full overflow-y-auto
          rounded-3xl border border-slate-200
          sm:max-w-md
          bg-white shadow-2xl
        "
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ConfirmationModal({
  open,
  title,
  description,
  confirmText,
  cancelText,
  variant,
  loading = false,
  icon,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmText: string;
  cancelText: string;
  variant: "primary" | "danger";
  loading?: boolean;
  icon: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const iconClasses =
    variant === "danger"
      ? "bg-red-100 text-red-700"
      : "bg-pink-100 text-pink-700";

  const confirmClasses =
    variant === "danger"
      ? `
        bg-red-600 text-white
        hover:bg-red-700
        focus:ring-red-200
      `
      : `
        bg-pink-600 text-white
        hover:bg-pink-700
        focus:ring-pink-200
      `;

  return (
    <ModalContainer open={open}>
      <div className="p-5 sm:p-6">
        <div
          className={`
            flex h-14 w-14 items-center justify-center
            rounded-2xl ${iconClasses}
          `}
        >
          {icon}
        </div>

        <h3 className="mt-4 text-lg font-bold text-slate-900 sm:mt-5 sm:text-xl">
          {title}
        </h3>

        <div className="mt-2 text-sm leading-6 text-slate-600">
          {description}
        </div>
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
            rounded-2xl border border-slate-300
            bg-white px-5 py-3
            font-semibold text-slate-700
            transition hover:bg-slate-100
            focus:outline-none focus:ring-4
            focus:ring-slate-200
            disabled:cursor-not-allowed
            disabled:opacity-50
            sm:w-auto
          "
        >
          {cancelText}
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`
            flex items-center justify-center gap-2
            rounded-2xl px-5 py-3
            font-semibold shadow-sm
            transition focus:outline-none
            focus:ring-4
            disabled:cursor-not-allowed
            disabled:opacity-50
            sm:w-auto
            ${confirmClasses}
          `}
        >
          {loading && <LoaderCircle className="h-5 w-5 animate-spin" />}

          {loading ? "Guardando..." : confirmText}
        </button>
      </div>
    </ModalContainer>
  );
}

function MessageModal({
  open,
  title,
  message,
  buttonText,
  variant,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  buttonText: string;
  variant: "error" | "success";
  onClose: () => void;
}) {
  const esError = variant === "error";

  return (
    <ModalContainer open={open}>
      <div className="p-5 sm:p-6">
        <div
          className={`
            flex h-14 w-14 items-center justify-center
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

        <h3 className="mt-4 text-lg font-bold text-slate-900 sm:mt-5 sm:text-xl">
          {title}
        </h3>

        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
          {message}
        </p>
      </div>

      <div
        className="
          flex justify-end border-t
          border-slate-200 bg-slate-50
          px-4 py-3
          sm:px-5 sm:py-4
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
            focus:outline-none focus:ring-4
            ${
              esError
                ? `
                  bg-red-600 hover:bg-red-700
                  focus:ring-red-200
                `
                : `
                  bg-emerald-600 hover:bg-emerald-700
                  focus:ring-emerald-200
                `
            }
          `}
        >
          {buttonText}
        </button>
      </div>
    </ModalContainer>
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
        mb-4 overflow-hidden rounded-3xl
        sm:mb-6
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
          <h3 className="font-bold text-slate-900">{title}</h3>

          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-5">{children}</div>
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
        <span className="ml-1 font-bold text-red-600" aria-hidden="true">
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
      <FieldLabel label={label} required={required} />

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="
          rounded-2xl border border-slate-300
          bg-[#F5F9FF] px-4 py-3
          text-base text-slate-900 shadow-sm
          outline-none transition
          sm:text-sm
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
  const valorFormateado = FormatHelper.formatearCedula(value);

  return (
    <label className="flex flex-col gap-2">
      <FieldLabel label={label} required={required} />

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
          numeros.length > 0 && !FormatHelper.cedulaCompleta(numeros)
        }
        onChange={(event) => {
          const cedulaLimpia = FormatHelper.limpiarCedula(event.target.value);

          onChange(cedulaLimpia);
        }}
        onInvalid={(event) => {
          const input = event.currentTarget;

          if (!numeros.length) {
            input.setCustomValidity("La cédula es obligatoria.");
            return;
          }

          input.setCustomValidity("Ingresá los 8 números de la cédula.");
        }}
        onInput={(event) => {
          event.currentTarget.setCustomValidity("");
        }}
        className="
          rounded-2xl border border-slate-300
          bg-[#F5F9FF] px-4 py-3
          text-base text-slate-900 shadow-sm
          outline-none transition
          sm:text-sm
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
      <FieldLabel label={label} required={required} />

      <textarea
        rows={4}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="
          resize-y rounded-2xl
          border border-slate-300
          bg-[#F5F9FF] px-4 py-3
          text-base text-slate-900 shadow-sm
          outline-none transition
          sm:text-sm
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
      <FieldLabel label={label} required={required} />

      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="
          rounded-2xl border border-slate-300
          bg-[#F5F9FF] px-4 py-3
          text-base text-slate-900 shadow-sm
          outline-none transition
          sm:text-sm
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
        rounded-2xl border px-3 py-3
        sm:px-4
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
        onChange={(event) => onChange(event.target.checked)}
        className="
          h-4 w-4 shrink-0
          accent-pink-600
        "
      />

      <div>
        <p className="font-semibold text-slate-800">{label}</p>

        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </label>
  );
}
