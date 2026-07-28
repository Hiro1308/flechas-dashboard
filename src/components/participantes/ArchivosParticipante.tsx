import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  ExternalLink,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

import Card from "../ui/Card";
import { supabase } from "../../services/supabase";

export type ArchivoParticipante = {
  id: string;
  nombre: string;
  url: string;
  tipo: string | null;
  created_at: string;
};

type TipoFiltro =
  | "todos"
  | "pdf"
  | "imagen"
  | "documento"
  | "planilla"
  | "texto"
  | "otro";

type ArchivosParticipanteProps = {
  idParticipante: string;
  archivos: ArchivoParticipante[];
  onChange: (archivos: ArchivoParticipante[]) => void;
};

function formatearFechaHora(value: string) {
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

function obtenerExtension(nombre: string) {
  const partes = nombre.split(".");

  if (partes.length < 2) {
    return "";
  }

  return partes.at(-1)?.toLowerCase() ?? "";
}

function obtenerCategoria(
  tipo: string | null,
  nombre: string,
): TipoFiltro {
  const mime = tipo?.toLowerCase() ?? "";
  const extension = obtenerExtension(nombre);

  if (
    mime === "application/pdf" ||
    extension === "pdf"
  ) {
    return "pdf";
  }

  if (
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
      extension,
    )
  ) {
    return "imagen";
  }

  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    ["xls", "xlsx", "csv", "ods"].includes(extension)
  ) {
    return "planilla";
  }

  if (
    mime.includes("word") ||
    mime.includes("document") ||
    ["doc", "docx", "odt", "rtf"].includes(extension)
  ) {
    return "documento";
  }

  if (
    mime.startsWith("text/") ||
    ["txt", "md"].includes(extension)
  ) {
    return "texto";
  }

  return "otro";
}

function obtenerNombreTipo(
  tipo: string | null,
  nombre: string,
) {
  const categoria = obtenerCategoria(tipo, nombre);

  const nombres: Record<TipoFiltro, string> = {
    todos: "Todos",
    pdf: "PDF",
    imagen: "Imagen",
    documento: "Documento",
    planilla: "Planilla",
    texto: "Texto",
    otro: "Otro archivo",
  };

  return nombres[categoria];
}

function obtenerIconoArchivo(
  tipo: string | null,
  nombre: string,
) {
  const categoria = obtenerCategoria(tipo, nombre);

  switch (categoria) {
    case "imagen":
      return <FileImage className="h-5 w-5" />;

    case "planilla":
      return <FileSpreadsheet className="h-5 w-5" />;

    case "pdf":
    case "documento":
    case "texto":
      return <FileText className="h-5 w-5" />;

    default:
      return <File className="h-5 w-5" />;
  }
}

function limpiarNombreArchivo(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

export default function ArchivosParticipante({
  idParticipante,
  archivos,
  onChange,
}: ArchivosParticipanteProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] =
    useState<TipoFiltro>("todos");

  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const archivosFiltrados = useMemo(() => {
    const textoBusqueda = busqueda
      .trim()
      .toLowerCase();

    return archivos.filter((archivo) => {
      const coincideNombre =
        !textoBusqueda ||
        archivo.nombre
          .toLowerCase()
          .includes(textoBusqueda);

      const categoria = obtenerCategoria(
        archivo.tipo,
        archivo.nombre,
      );

      const coincideTipo =
        tipoFiltro === "todos" ||
        categoria === tipoFiltro;

      return coincideNombre && coincideTipo;
    });
  }, [archivos, busqueda, tipoFiltro]);

  const limpiarMensajes = () => {
    setError("");
    setSuccess("");
  };

  const subirArchivo = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const archivo = event.target.files?.[0];

    event.target.value = "";

    if (!archivo) {
      return;
    }

    limpiarMensajes();

    const limiteBytes = 50 * 1024 * 1024;

    if (archivo.size > limiteBytes) {
      setError(
        "El archivo supera el máximo permitido de 50 MB.",
      );

      return;
    }

    setUploading(true);

    const nombreSeguro = limpiarNombreArchivo(
      archivo.name,
    );

    const rutaStorage = `${idParticipante}/${crypto.randomUUID()}-${nombreSeguro}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("participantes-archivos")
      .upload(rutaStorage, archivo, {
        cacheControl: "3600",
        upsert: false,
        contentType:
          archivo.type ||
          "application/octet-stream",
      });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);

      return;
    }

    const {
      data: archivoGuardado,
      error: insertError,
    } = await supabase
      .from("archivos_participante")
      .insert({
        id_participante: idParticipante,
        nombre: archivo.name,
        url: rutaStorage,
        tipo:
          archivo.type ||
          `application/${obtenerExtension(
            archivo.name,
          ) || "octet-stream"}`,
      })
      .select(
        `
          id,
          nombre,
          url,
          tipo,
          created_at
        `,
      )
      .single();

    if (insertError) {
      await supabase.storage
        .from("participantes-archivos")
        .remove([rutaStorage]);

      setError(insertError.message);
      setUploading(false);

      return;
    }

    onChange([
      archivoGuardado as ArchivoParticipante,
      ...archivos,
    ]);

    setSuccess("El archivo se subió correctamente.");
    setUploading(false);

    window.setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  const abrirArchivo = async (
    archivo: ArchivoParticipante,
  ) => {
    limpiarMensajes();

    if (
      archivo.url.startsWith("http://") ||
      archivo.url.startsWith("https://")
    ) {
      window.open(
        archivo.url,
        "_blank",
        "noopener,noreferrer",
      );

      return;
    }

    const {
      data,
      error: signedUrlError,
    } = await supabase.storage
      .from("participantes-archivos")
      .createSignedUrl(archivo.url, 600);

    if (signedUrlError) {
      setError(signedUrlError.message);
      return;
    }

    window.open(
      data.signedUrl,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const eliminarArchivo = async (
    archivo: ArchivoParticipante,
  ) => {
    const confirmado = window.confirm(
      `¿Querés eliminar el archivo "${archivo.nombre}"?`,
    );

    if (!confirmado) {
      return;
    }

    limpiarMensajes();
    setDeletingId(archivo.id);

    const {
      error: deleteRowError,
    } = await supabase
      .from("archivos_participante")
      .delete()
      .eq("id", archivo.id);

    if (deleteRowError) {
      setError(deleteRowError.message);
      setDeletingId(null);

      return;
    }

    if (
      !archivo.url.startsWith("http://") &&
      !archivo.url.startsWith("https://")
    ) {
      const {
        error: deleteStorageError,
      } = await supabase.storage
        .from("participantes-archivos")
        .remove([archivo.url]);

      if (deleteStorageError) {
        setError(
          `Se eliminó el registro, pero no fue posible eliminar el archivo del almacenamiento: ${deleteStorageError.message}`,
        );
      }
    }

    onChange(
      archivos.filter(
        (item) => item.id !== archivo.id,
      ),
    );

    setSuccess("El archivo se eliminó correctamente.");
    setDeletingId(null);

    window.setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  return (
    <Card className="overflow-hidden p-0">
      <div
        className="
          flex flex-col gap-4
          border-b border-slate-200
          px-6 py-5
          lg:flex-row lg:items-center
          lg:justify-between
        "
      >
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Archivos
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Documentos y archivos asociados a la
            participante.
          </p>
        </div>

        <div
          className="
            flex flex-col gap-3
            sm:flex-row sm:items-center
          "
        >
          <div
            className="
              flex items-center gap-3
              rounded-2xl border
              border-slate-300 bg-[#F5F9FF]
              px-4 py-3 shadow-sm
              transition-colors
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
              placeholder="Buscar por nombre..."
              className="
                w-full min-w-0 bg-transparent
                text-sm text-slate-900
                outline-none
                placeholder:text-slate-400
                sm:w-56
              "
            />
          </div>

          <select
            value={tipoFiltro}
            onChange={(event) =>
              setTipoFiltro(
                event.target.value as TipoFiltro,
              )
            }
            className="
              rounded-2xl border
              border-slate-300 bg-[#F5F9FF]
              px-4 py-3 text-sm
              font-medium text-slate-700
              shadow-sm outline-none
              transition-colors
              hover:border-slate-400
              focus:border-pink-400
              focus:bg-white
              focus:ring-4
              focus:ring-pink-100
            "
          >
            <option value="todos">
              Todos los tipos
            </option>

            <option value="pdf">PDF</option>
            <option value="imagen">Imágenes</option>

            <option value="documento">
              Documentos
            </option>

            <option value="planilla">
              Planillas
            </option>

            <option value="texto">
              Archivos de texto
            </option>

            <option value="otro">
              Otros archivos
            </option>
          </select>

          <input
            ref={inputRef}
            type="file"
            onChange={(event) =>
              void subirArchivo(event)
            }
            className="hidden"
          />

          <button
            type="button"
            onClick={() =>
              inputRef.current?.click()
            }
            disabled={uploading}
            className="
              flex items-center justify-center
              gap-2 rounded-2xl
              bg-pink-600 px-5 py-3
              font-semibold text-white
              shadow-sm transition-colors
              hover:bg-pink-700
              focus:outline-none focus:ring-4
              focus:ring-pink-200
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <Upload className="h-4 w-4" />

            {uploading
              ? "Subiendo..."
              : "Subir archivo"}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="
            mx-6 mt-5 rounded-2xl
            border border-red-200
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
            mx-6 mt-5 rounded-2xl
            border border-green-200
            bg-green-50 px-4 py-3
            text-sm font-medium text-green-700
          "
        >
          {success}
        </div>
      )}

      <div className="p-6">
        <div className="mb-4 text-sm text-slate-500">
          {archivosFiltrados.length}{" "}
          {archivosFiltrados.length === 1
            ? "archivo"
            : "archivos"}
        </div>

        {archivosFiltrados.length === 0 ? (
          <div
            className="
              rounded-3xl border
              border-dashed border-slate-300
              bg-[#F5F9FF] px-6 py-12
              text-center
            "
          >
            <FileText className="mx-auto h-10 w-10 text-slate-400" />

            <h3 className="mt-4 font-bold text-slate-800">
              No hay archivos para mostrar
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Subí un archivo o modificá los filtros
              seleccionados.
            </p>
          </div>
        ) : (
          <div
            className="
              grid grid-cols-1 gap-4
              md:grid-cols-2
              xl:grid-cols-3
            "
          >
            {archivosFiltrados.map((archivo) => (
              <article
                key={archivo.id}
                className="
                  flex min-w-0 flex-col
                  rounded-3xl border
                  border-slate-200
                  bg-[#F5F9FF] p-5
                  transition-colors
                  hover:border-pink-200
                  hover:bg-[#FFF5F9]
                "
              >
                <div
                  className="
                    flex items-start
                    justify-between gap-3
                  "
                >
                  <div
                    title={obtenerNombreTipo(
                      archivo.tipo,
                      archivo.nombre,
                    )}
                    className="
                      flex h-11 w-11 shrink-0
                      items-center justify-center
                      rounded-2xl bg-white
                      text-pink-600 shadow-sm
                    "
                  >
                    {obtenerIconoArchivo(
                      archivo.tipo,
                      archivo.nombre,
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void eliminarArchivo(archivo)
                    }
                    disabled={
                      deletingId === archivo.id
                    }
                    title="Eliminar archivo"
                    aria-label={`Eliminar ${archivo.nombre}`}
                    className="
                      rounded-xl p-2
                      text-red-500
                      transition-colors
                      hover:bg-red-50
                      hover:text-red-700
                      focus:outline-none
                      focus:ring-4
                      focus:ring-red-100
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 min-w-0">
                  <h3
                    className="
                      truncate font-bold
                      text-slate-900
                    "
                    title={archivo.nombre}
                  >
                    {archivo.nombre}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {obtenerNombreTipo(
                      archivo.tipo,
                      archivo.nombre,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {formatearFechaHora(
                      archivo.created_at,
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void abrirArchivo(archivo)
                  }
                  className="
                    mt-5 flex items-center
                    justify-center gap-2
                    rounded-2xl border
                    border-slate-300 bg-white
                    px-4 py-2.5
                    font-semibold text-slate-700
                    transition-colors
                    hover:border-pink-300
                    hover:text-pink-700
                    focus:outline-none
                    focus:ring-4
                    focus:ring-pink-100
                  "
                >
                  <ExternalLink className="h-4 w-4" />

                  Abrir archivo
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}