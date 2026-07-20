import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card from "../components/ui/Card";
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
  ultimo_pago?: { fecha_pago: string | null }[] | null;
};

type FormState = {
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

const initialForm = (): FormState => ({
  tipo_participante: "fundacion",
  fecha_ingreso: new Date().toISOString().slice(0, 10),
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

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-UY").format(new Date(`${value}T00:00:00`))
    : "Sin registrar";

export default function ParticipantesPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(initialForm);

  const cargarParticipantes = async () => {
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("participantes")
      .select(
        `
        id, tipo_participante, nombre, apellido, ci, fecha_nacimiento,
        direccion, telefono, telefono_alternativo, email, ocupacion,
        prestador_salud, emergencia_movil, fecha_cirugia, tipo_cirugia,
        hta, diabetes, alergias, otros_antecedentes, desarrolla_linfedema,
        miembro_afectado, observaciones, estado, fecha_ingreso,
        ultimo_pago:v_ultimo_pago_participante(fecha_pago)
      `,
      )
      .order("apellido", { ascending: true })
      .order("nombre", { ascending: true });

    if (queryError) setError(queryError.message);
    else setParticipantes((data ?? []) as Participante[]);

    setLoading(false);
  };

  useEffect(() => {
    void cargarParticipantes();
  }, []);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return participantes;
    return participantes.filter((p) =>
      `${p.nombre} ${p.apellido} ${p.ci} ${p.telefono ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [busqueda, participantes]);

  const guardarParticipante = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      tipo_participante: form.tipo_participante,
      fecha_ingreso: form.fecha_ingreso,
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      ci: form.ci.trim(),
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

    const { error: insertError } = await supabase
      .from("participantes")
      .insert(payload);

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Ya existe una participante con esa cédula."
          : insertError.message,
      );
    } else {
      setForm(initialForm());
      setShowForm(false);
      await cargarParticipantes();
    }

    setSaving(false);
  };

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
            <h1 className="text-3xl font-bold text-slate-900">Participantes</h1>

            <p className="mt-2 text-slate-500">Gestión de participantes</p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="
            rounded-2xl bg-pink-600 px-5 py-3 font-semibold text-white
            transition hover:bg-pink-700
          "
          >
            Nueva participante
          </button>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <p className="font-semibold text-slate-700">
              {participantes.length} participantes registradas
            </p>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-200 px-4 py-3">
              <Search className="h-4 w-4 text-slate-500" />

              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, CI o teléfono..."
                className="
                w-72 bg-transparent text-sm text-slate-900 outline-none
                placeholder:text-slate-500
              "
              />
            </div>
          </div>

          {error && (
            <div className="m-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-left">
                {["Nombre", "CI", "Teléfono", "Estado", "Último pago"].map(
                  (title) => (
                    <th
                      key={title}
                      className="px-6 py-4 text-sm font-semibold text-slate-600"
                    >
                      {title}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {!loading &&
                filtradas.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/participantes/${p.id}`)}
                    className="
                    cursor-pointer border-b border-slate-100
                    transition hover:bg-pink-50
                  "
                  >
                    <td className="px-6 py-5 font-medium text-slate-900">
                      {p.nombre} {p.apellido}
                    </td>

                    <td className="px-6 py-5 text-slate-600">{p.ci}</td>

                    <td className="px-6 py-5 text-slate-600">
                      {p.telefono || "Sin registrar"}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`
                        rounded-full px-3 py-1 text-xs font-semibold
                        ${
                          p.estado === "activa"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-600"
                        }
                      `}
                      >
                        {p.estado === "activa" ? "Activa" : "Baja"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-slate-600">
                      {formatDate(p.ultimo_pago?.[0]?.fecha_pago)}
                    </td>
                  </tr>
                ))}

              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Cargando participantes...
                  </td>
                </tr>
              )}

              {!loading && filtradas.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No se encontraron participantes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <div
        className={`
        fixed right-0 top-0 z-50 h-screen w-[720px]
        border-l border-[#bbb1b5] bg-[#ddd6d9] shadow-2xl
        transition-transform duration-300
        ${showForm ? "translate-x-0" : "translate-x-full"}
      `}
      >
        <div className="flex h-full flex-col">
          <div
            className="
            flex items-center justify-between
            border-b border-[#bbb1b5] bg-[#d2c8cc] px-6 py-5
          "
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Nueva participante
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Cargar ficha personal
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="
              rounded-full p-2 text-slate-600
              transition hover:bg-white/50 hover:text-slate-900
            "
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={guardarParticipante}
            className="flex-1 overflow-y-auto bg-[#ddd6d9] px-6 py-6"
          >
            <p className="mb-6 text-sm font-medium text-slate-600">
              Los campos marcados con{" "}
              <span className="font-bold text-red-600">*</span> son
              obligatorios.
            </p>

            <Section title="Tipo de ficha">
              <Select
                required
                label="Tipo de participante"
                value={form.tipo_participante}
                onChange={(v) =>
                  setForm({
                    ...form,
                    tipo_participante: v as FormState["tipo_participante"],
                  })
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
                onChange={(v) =>
                  setForm({
                    ...form,
                    fecha_ingreso: v,
                  })
                }
              />
            </Section>

            <Section title="Datos personales">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  required
                  label="Nombre"
                  value={form.nombre}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      nombre: v,
                    })
                  }
                />

                <Input
                  required
                  label="Apellido"
                  value={form.apellido}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      apellido: v,
                    })
                  }
                />

                <Input
                  required
                  label="Cédula"
                  value={form.ci}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      ci: v,
                    })
                  }
                />

                <Input
                  label="Fecha de nacimiento"
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      fecha_nacimiento: v,
                    })
                  }
                />

                <Input
                  label="Teléfono"
                  value={form.telefono}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      telefono: v,
                    })
                  }
                />

                <Input
                  label="Teléfono alternativo"
                  value={form.telefono_alternativo}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      telefono_alternativo: v,
                    })
                  }
                />
              </div>

              <Input
                label="Dirección"
                value={form.direccion}
                onChange={(v) =>
                  setForm({
                    ...form,
                    direccion: v,
                  })
                }
              />

              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) =>
                  setForm({
                    ...form,
                    email: v,
                  })
                }
              />

              <Input
                label="Ocupación"
                value={form.ocupacion}
                onChange={(v) =>
                  setForm({
                    ...form,
                    ocupacion: v,
                  })
                }
              />
            </Section>

            <Section title="Información de salud">
              <Input
                label="Prestador de salud"
                value={form.prestador_salud}
                onChange={(v) =>
                  setForm({
                    ...form,
                    prestador_salud: v,
                  })
                }
              />

              <Input
                label="Emergencia móvil"
                value={form.emergencia_movil}
                onChange={(v) =>
                  setForm({
                    ...form,
                    emergencia_movil: v,
                  })
                }
              />

              <Input
                label="Fecha de cirugía"
                type="date"
                value={form.fecha_cirugia}
                onChange={(v) =>
                  setForm({
                    ...form,
                    fecha_cirugia: v,
                  })
                }
              />

              <Input
                label="Tipo de cirugía"
                value={form.tipo_cirugia}
                onChange={(v) =>
                  setForm({
                    ...form,
                    tipo_cirugia: v,
                  })
                }
              />
            </Section>

            <Section title="Antecedentes personales">
              <div className="grid grid-cols-2 gap-4">
                <Checkbox
                  label="HTA"
                  checked={form.hta}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      hta: v,
                    })
                  }
                />

                <Checkbox
                  label="Diabetes"
                  checked={form.diabetes}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      diabetes: v,
                    })
                  }
                />
              </div>

              <Textarea
                label="Alergias"
                value={form.alergias}
                onChange={(v) =>
                  setForm({
                    ...form,
                    alergias: v,
                  })
                }
              />

              <Textarea
                label="Otros antecedentes"
                value={form.otros_antecedentes}
                onChange={(v) =>
                  setForm({
                    ...form,
                    otros_antecedentes: v,
                  })
                }
              />
            </Section>

            <Section title="Valoración de linfedema">
              <Select
                label="Desarrolla linfedema"
                value={form.desarrolla_linfedema}
                onChange={(v) =>
                  setForm({
                    ...form,
                    desarrolla_linfedema:
                      v as FormState["desarrolla_linfedema"],
                  })
                }
              >
                <option value="">Seleccionar</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </Select>

              <Select
                label="Miembro superior afectado"
                value={form.miembro_afectado}
                onChange={(v) =>
                  setForm({
                    ...form,
                    miembro_afectado: v as FormState["miembro_afectado"],
                  })
                }
              >
                <option value="">Seleccionar</option>
                <option value="derecho">Derecho</option>
                <option value="izquierdo">Izquierdo</option>
                <option value="ambos">Ambos</option>
              </Select>

              <Textarea
                label="Observaciones"
                value={form.observaciones}
                onChange={(v) =>
                  setForm({
                    ...form,
                    observaciones: v,
                  })
                }
              />
            </Section>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div
              className="
              sticky bottom-0 -mx-6 mt-8 flex justify-end gap-3
              border-t border-[#bbb1b5] bg-[#d2c8cc] px-6 py-5
            "
            >
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="
                rounded-2xl border border-slate-400 bg-white/60
                px-5 py-3 font-semibold text-slate-700
                transition hover:bg-white
              "
              >
                Cancelar
              </button>

              <button
                disabled={saving}
                type="submit"
                className="
                rounded-2xl bg-pink-600 px-6 py-3
                font-semibold text-white transition
                hover:bg-pink-700 disabled:cursor-not-allowed
                disabled:opacity-50
              "
              >
                {saving ? "Guardando..." : "Guardar participante"}
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
    <section
      className="
        mb-6 rounded-3xl border border-[#c9adb8]
        bg-white/30 p-5
      "
    >
      <h3 className="mb-4 text-lg font-bold text-slate-900">{title}</h3>

      <div className="flex flex-col gap-4">{children}</div>
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
        onChange={(e) => onChange(e.target.value)}
        className="
          rounded-2xl border border-slate-400 bg-slate-300
          px-4 py-3 text-slate-900 outline-none transition
          placeholder:text-slate-500
          hover:bg-slate-200
          focus:border-pink-500 focus:bg-white
          focus:ring-4 focus:ring-pink-200
        "
      />
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
        rows={3}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="
          resize-none rounded-2xl border border-slate-400
          bg-slate-300 px-4 py-3 text-slate-900
          outline-none transition placeholder:text-slate-500
          hover:bg-slate-200
          focus:border-pink-500 focus:bg-white
          focus:ring-4 focus:ring-pink-200
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
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <FieldLabel label={label} required={required} />

      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="
          rounded-2xl border border-slate-400 bg-slate-300
          px-4 py-3 text-slate-900 outline-none transition
          hover:bg-slate-200
          focus:border-pink-500 focus:bg-white
          focus:ring-4 focus:ring-pink-200
        "
      >
        {children}
      </select>
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className="
        flex cursor-pointer items-center gap-3 rounded-2xl
        border border-slate-400 bg-slate-300 px-4 py-3
        transition hover:bg-slate-200
      "
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-pink-600"
      />

      <span className="font-medium text-slate-800">{label}</span>
    </label>
  );
}
