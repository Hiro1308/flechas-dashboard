import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
} from "react";
import {
  ExternalLink,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Grid2X2,
  List,
  LoaderCircle,
  Search,
  Trash2,
  Upload,
  X,
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

type TipoVista = "lista" | "cuadricula";

type TipoOrden =
  | "fecha_desc"
  | "fecha_asc"
  | "nombre_asc"
  | "nombre_desc";

type ArchivosParticipanteProps = {
  idParticipante: string;
  archivos: ArchivoParticipante[];
  onChange: (archivos: ArchivoParticipante[]) => void;
};

function formatearFechaHora(value: string) {
  const fecha = new Date(value);

  if (Number.isNaN(fecha.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).format(fecha);
}

function obtenerExtension(nombre: string) {
  const partes = nombre.split(".");

  if (partes.length < 2) {
    return "";
  }

  return partes.at(-1)?.toLowerCase() ?? "";
}

function obtenerNombreSinExtension(nombre: string) {
  const extension = obtenerExtension(nombre);

  if (!extension) {
    return nombre;
  }

  return nombre.slice(0, -(extension.length + 1));
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
    [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "svg",
      "bmp",
      "avif",
    ].includes(extension)
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
    ["txt", "md", "json", "xml", "html", "css"].includes(
      extension,
    )
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
  className = "h-5 w-5",
) {
  const categoria = obtenerCategoria(tipo, nombre);

  switch (categoria) {
    case "imagen":
      return <FileImage className={className} />;

    case "planilla":
      return <FileSpreadsheet className={className} />;

    case "pdf":
    case "documento":
    case "texto":
      return <FileText className={className} />;

    default:
      return <File className={className} />;
  }
}

function limpiarNombreArchivo(nombre: string) {
  const nombreLimpio = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return nombreLimpio || "archivo";
}

function compararPorNombre(
  primerArchivo: ArchivoParticipante,
  segundoArchivo: ArchivoParticipante,
) {
  return primerArchivo.nombre.localeCompare(
    segundoArchivo.nombre,
    "es",
    {
      sensitivity: "base",
      numeric: true,
    },
  );
}

function obtenerTimestamp(value: string) {
  const fecha = new Date(value);
  const timestamp = fecha.getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatearTamanoArchivo(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function admiteVistaPrevia(
  archivo: ArchivoParticipante,
) {
  const categoria = obtenerCategoria(
    archivo.tipo,
    archivo.nombre,
  );

  return (
    categoria === "imagen" ||
    categoria === "pdf" ||
    categoria === "texto"
  );
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

  const [tipoVista, setTipoVista] =
    useState<TipoVista>("lista");

  const [tipoOrden, setTipoOrden] =
    useState<TipoOrden>("fecha_desc");

  const [modalSubidaAbierto, setModalSubidaAbierto] =
    useState(false);

  const [archivoSeleccionado, setArchivoSeleccionado] =
    useState<File | null>(null);

  const [nombreArchivo, setNombreArchivo] =
    useState("");

  const [arrastrando, setArrastrando] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [errorModal, setErrorModal] =
    useState("");

  const [success, setSuccess] = useState("");

  const [archivoVistaPrevia, setArchivoVistaPrevia] =
    useState<ArchivoParticipante | null>(null);

  const [urlVistaPrevia, setUrlVistaPrevia] =
    useState("");

  const [cargandoVistaPrevia, setCargandoVistaPrevia] =
    useState(false);

  const [errorVistaPrevia, setErrorVistaPrevia] =
    useState("");

  const [urlsMiniatura, setUrlsMiniatura] = useState<
    Record<string, string>
  >({});

  const archivosFiltrados = useMemo(() => {
    const textoBusqueda = busqueda
      .trim()
      .toLocaleLowerCase("es");

    const resultado = archivos.filter((archivo) => {
      const coincideNombre =
        !textoBusqueda ||
        archivo.nombre
          .toLocaleLowerCase("es")
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

    return [...resultado].sort(
      (primerArchivo, segundoArchivo) => {
        switch (tipoOrden) {
          case "fecha_asc":
            return (
              obtenerTimestamp(
                primerArchivo.created_at,
              ) -
              obtenerTimestamp(
                segundoArchivo.created_at,
              )
            );

          case "nombre_asc":
            return compararPorNombre(
              primerArchivo,
              segundoArchivo,
            );

          case "nombre_desc":
            return compararPorNombre(
              segundoArchivo,
              primerArchivo,
            );

          case "fecha_desc":
          default:
            return (
              obtenerTimestamp(
                segundoArchivo.created_at,
              ) -
              obtenerTimestamp(
                primerArchivo.created_at,
              )
            );
        }
      },
    );
  }, [
    archivos,
    busqueda,
    tipoFiltro,
    tipoOrden,
  ]);

  useEffect(() => {
    if (tipoVista !== "cuadricula") {
      return;
    }

    let cancelado = false;

    const cargarMiniaturas = async () => {
      const archivosCompatibles =
        archivosFiltrados.filter(
          (archivo) =>
            admiteVistaPrevia(archivo) &&
            !urlsMiniatura[archivo.id],
        );

      if (archivosCompatibles.length === 0) {
        return;
      }

      const nuevasUrls: Record<string, string> = {};

      await Promise.all(
        archivosCompatibles.map(async (archivo) => {
          if (
            archivo.url.startsWith("http://") ||
            archivo.url.startsWith("https://")
          ) {
            nuevasUrls[archivo.id] = archivo.url;
            return;
          }

          const { data, error: signedUrlError } =
            await supabase.storage
              .from("participantes-archivos")
              .createSignedUrl(archivo.url, 3600);

          if (!signedUrlError && data?.signedUrl) {
            nuevasUrls[archivo.id] =
              data.signedUrl;
          }
        }),
      );

      if (
        !cancelado &&
        Object.keys(nuevasUrls).length > 0
      ) {
        setUrlsMiniatura((actuales) => ({
          ...actuales,
          ...nuevasUrls,
        }));
      }
    };

    void cargarMiniaturas();

    return () => {
      cancelado = true;
    };
  }, [
    archivosFiltrados,
    tipoVista,
    urlsMiniatura,
  ]);

  const limpiarMensajes = () => {
    setError("");
    setSuccess("");
  };

  const mostrarMensajeExito = (mensaje: string) => {
    setSuccess(mensaje);

    window.setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  const reiniciarModalSubida = () => {
    setArchivoSeleccionado(null);
    setNombreArchivo("");
    setArrastrando(false);
    setErrorModal("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const abrirModalSubida = () => {
    limpiarMensajes();
    reiniciarModalSubida();
    setModalSubidaAbierto(true);
  };

  const cerrarModalSubida = () => {
    if (uploading) {
      return;
    }

    setModalSubidaAbierto(false);
    reiniciarModalSubida();
  };

  const seleccionarArchivo = (archivo: File) => {
    setErrorModal("");

    const limiteBytes = 50 * 1024 * 1024;

    if (archivo.size > limiteBytes) {
      setArchivoSeleccionado(null);
      setNombreArchivo("");

      setErrorModal(
        "El archivo supera el máximo permitido de 50 MB.",
      );

      return;
    }

    setArchivoSeleccionado(archivo);

    setNombreArchivo(
      obtenerNombreSinExtension(archivo.name),
    );
  };

  const manejarSeleccionArchivo = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const archivo = event.target.files?.[0];

    if (!archivo) {
      return;
    }

    seleccionarArchivo(archivo);
  };

  const manejarDragEnter = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setArrastrando(true);
  };

  const manejarDragOver = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    event.dataTransfer.dropEffect = "copy";
    setArrastrando(true);
  };

  const manejarDragLeave = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setArrastrando(false);
  };

  const manejarDrop = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setArrastrando(false);

    const archivo = event.dataTransfer.files?.[0];

    if (!archivo) {
      return;
    }

    seleccionarArchivo(archivo);
  };

  const quitarArchivoSeleccionado = () => {
    setArchivoSeleccionado(null);
    setNombreArchivo("");
    setErrorModal("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const subirArchivo = async () => {
    if (!archivoSeleccionado) {
      setErrorModal(
        "Seleccioná un archivo para continuar.",
      );

      return;
    }

    const nombreIngresado = nombreArchivo.trim();

    if (!nombreIngresado) {
      setErrorModal(
        "Ingresá un nombre para el archivo.",
      );

      return;
    }

    limpiarMensajes();
    setErrorModal("");
    setUploading(true);

    const extensionOriginal = obtenerExtension(
      archivoSeleccionado.name,
    );

    const nombreSinExtensionIngresada =
      obtenerNombreSinExtension(nombreIngresado).trim();

    if (!nombreSinExtensionIngresada) {
      setErrorModal(
        "Ingresá un nombre válido para el archivo.",
      );

      setUploading(false);
      return;
    }

    const nombreVisible = nombreSinExtensionIngresada;

    const nombreFisico = extensionOriginal
      ? `${nombreVisible}.${extensionOriginal}`
      : nombreVisible;

    const nombreSeguro = limpiarNombreArchivo(
      nombreFisico,
    );

    const carpetaCarga = Date.now().toString();

    const rutaStorage =
      `${idParticipante}/${carpetaCarga}/${nombreSeguro}`;

    try {
      const { error: uploadError } =
        await supabase.storage
          .from("participantes-archivos")
          .upload(
            rutaStorage,
            archivoSeleccionado,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                archivoSeleccionado.type ||
                "application/octet-stream",
            },
          );

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: archivoGuardado,
        error: insertError,
      } = await supabase
        .from("archivos_participante")
        .insert({
          id_participante: idParticipante,
          nombre: nombreVisible,
          url: rutaStorage,
          tipo:
            archivoSeleccionado.type ||
            `application/${
              extensionOriginal ||
              "octet-stream"
            }`,
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

        throw insertError;
      }

      onChange([
        archivoGuardado as ArchivoParticipante,
        ...archivos,
      ]);

      setModalSubidaAbierto(false);
      reiniciarModalSubida();

      mostrarMensajeExito(
        "El archivo se subió correctamente.",
      );
    } catch (uploadError) {
      const mensaje =
        uploadError instanceof Error
          ? uploadError.message
          : "No fue posible subir el archivo.";

      setErrorModal(mensaje);
    } finally {
      setUploading(false);
    }
  };

  const obtenerUrlArchivo = async (
    archivo: ArchivoParticipante,
    descargar = false,
  ) => {
    if (
      archivo.url.startsWith("http://") ||
      archivo.url.startsWith("https://")
    ) {
      return archivo.url;
    }

    const { data, error: signedUrlError } =
      await supabase.storage
        .from("participantes-archivos")
        .createSignedUrl(
          archivo.url,
          600,
          descargar
            ? {
                download: archivo.nombre,
              }
            : undefined,
        );

    if (signedUrlError) {
      throw signedUrlError;
    }

    return data.signedUrl;
  };

  const abrirArchivo = async (
    archivo: ArchivoParticipante,
  ) => {
    limpiarMensajes();

    try {
      const url = await obtenerUrlArchivo(
        archivo,
        true,
      );

      window.open(
        url,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (openError) {
      setError(
        openError instanceof Error
          ? openError.message
          : "No fue posible abrir el archivo.",
      );
    }
  };

  const abrirVistaPrevia = async (
    archivo: ArchivoParticipante,
  ) => {
    setArchivoVistaPrevia(archivo);
    setUrlVistaPrevia("");
    setErrorVistaPrevia("");
    setCargandoVistaPrevia(true);

    try {
      const url =
        urlsMiniatura[archivo.id] ||
        (await obtenerUrlArchivo(archivo));

      setUrlVistaPrevia(url);

      setUrlsMiniatura((actuales) => ({
        ...actuales,
        [archivo.id]: url,
      }));
    } catch (previewError) {
      setErrorVistaPrevia(
        previewError instanceof Error
          ? previewError.message
          : "No fue posible cargar la vista previa.",
      );
    } finally {
      setCargandoVistaPrevia(false);
    }
  };

  const cerrarVistaPrevia = () => {
    setArchivoVistaPrevia(null);
    setUrlVistaPrevia("");
    setErrorVistaPrevia("");
    setCargandoVistaPrevia(false);
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

    try {
      const { error: deleteRowError } =
        await supabase
          .from("archivos_participante")
          .delete()
          .eq("id", archivo.id);

      if (deleteRowError) {
        throw deleteRowError;
      }

      if (
        !archivo.url.startsWith("http://") &&
        !archivo.url.startsWith("https://")
      ) {
        const { error: deleteStorageError } =
          await supabase.storage
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

      setUrlsMiniatura((actuales) => {
        const nuevasUrls = { ...actuales };
        delete nuevasUrls[archivo.id];

        return nuevasUrls;
      });

      if (
        archivoVistaPrevia?.id === archivo.id
      ) {
        cerrarVistaPrevia();
      }

      mostrarMensajeExito(
        "El archivo se eliminó correctamente.",
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No fue posible eliminar el archivo.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const evitarClickTarjeta = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
  };

  const renderizarMiniatura = (
    archivo: ArchivoParticipante,
  ) => {
    const categoria = obtenerCategoria(
      archivo.tipo,
      archivo.nombre,
    );

    const url = urlsMiniatura[archivo.id];

    if (categoria === "imagen" && url) {
      return (
        <img
          src={url}
          alt={archivo.nombre}
          loading="lazy"
          className="
            h-full w-full object-cover
            transition-transform duration-300
            group-hover:scale-[1.03]
          "
        />
      );
    }

    if (categoria === "pdf" && url) {
      return (
        <iframe
          src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
          title={`Vista previa de ${archivo.nombre}`}
          tabIndex={-1}
          className="
            pointer-events-none
            h-[170%] w-full
            origin-top scale-100
            border-0 bg-white
          "
        />
      );
    }

    if (categoria === "texto" && url) {
      return (
        <iframe
          src={url}
          title={`Vista previa de ${archivo.nombre}`}
          tabIndex={-1}
          className="
            pointer-events-none
            h-full w-full border-0
            bg-white
          "
        />
      );
    }

    return (
      <div
        className="
          flex h-full flex-col
          items-center justify-center
          px-5 text-center
        "
      >
        <div
          className="
            flex h-16 w-16 items-center
            justify-center rounded-3xl
            bg-white text-pink-600
            shadow-sm
          "
        >
          {obtenerIconoArchivo(
            archivo.tipo,
            archivo.nombre,
            "h-8 w-8",
          )}
        </div>

        <span
          className="
            mt-3 text-xs font-semibold
            uppercase tracking-wide
            text-slate-400
          "
        >
          {obtenerNombreTipo(
            archivo.tipo,
            archivo.nombre,
          )}
        </span>
      </div>
    );
  };

  const renderizarContenidoVistaPrevia = () => {
    if (!archivoVistaPrevia) {
      return null;
    }

    if (cargandoVistaPrevia) {
      return (
        <div
          className="
            flex h-full min-h-[420px]
            items-center justify-center
          "
        >
          <div className="text-center">
            <LoaderCircle
              className="
                mx-auto h-9 w-9
                animate-spin text-pink-600
              "
            />

            <p className="mt-3 text-sm text-slate-500">
              Cargando vista previa...
            </p>
          </div>
        </div>
      );
    }

    if (errorVistaPrevia) {
      return (
        <div
          className="
            flex h-full min-h-[420px]
            items-center justify-center
            p-6 text-center
          "
        >
          <div>
            <FileText className="mx-auto h-12 w-12 text-slate-400" />

            <p className="mt-4 font-semibold text-slate-700">
              No fue posible cargar la vista previa
            </p>

            <p className="mt-2 text-sm text-red-600">
              {errorVistaPrevia}
            </p>
          </div>
        </div>
      );
    }

    const categoria = obtenerCategoria(
      archivoVistaPrevia.tipo,
      archivoVistaPrevia.nombre,
    );

    if (categoria === "imagen") {
      return (
        <div
          className="
            flex h-full min-h-[420px]
            items-center justify-center
            overflow-auto bg-slate-100 p-5
          "
        >
          <img
            src={urlVistaPrevia}
            alt={archivoVistaPrevia.nombre}
            className="
              max-h-[72vh] max-w-full
              rounded-2xl object-contain
              shadow-lg
            "
          />
        </div>
      );
    }

    if (
      categoria === "pdf" ||
      categoria === "texto"
    ) {
      return (
        <iframe
          src={urlVistaPrevia}
          title={`Vista previa de ${archivoVistaPrevia.nombre}`}
          className="
            h-[72vh] min-h-[500px]
            w-full border-0 bg-white
          "
        />
      );
    }

    return (
      <div
        className="
          flex min-h-[500px]
          items-center justify-center
          bg-[#F5F9FF] p-8
          text-center
        "
      >
        <div>
          <div
            className="
              mx-auto flex h-24 w-24
              items-center justify-center
              rounded-[32px] bg-white
              text-pink-600 shadow-sm
            "
          >
            {obtenerIconoArchivo(
              archivoVistaPrevia.tipo,
              archivoVistaPrevia.nombre,
              "h-12 w-12",
            )}
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-800">
            Vista previa no disponible
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Este tipo de archivo no puede mostrarse
            directamente en el navegador. Podés abrirlo
            para verlo con la aplicación correspondiente.
          </p>

          <button
            type="button"
            onClick={() =>
              void abrirArchivo(archivoVistaPrevia)
            }
            className="
              mt-6 inline-flex items-center
              justify-center gap-2
              rounded-2xl bg-pink-600
              px-5 py-3 font-semibold
              text-white transition-colors
              hover:bg-pink-700
              focus:outline-none
              focus:ring-4
              focus:ring-pink-200
            "
          >
            <ExternalLink className="h-4 w-4" />
            Abrir archivo
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="overflow-hidden p-0">
        <div
          className="
            flex flex-col gap-4
            border-b border-slate-200
            px-6 py-5
            xl:flex-row xl:items-center
            xl:justify-between
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
              sm:flex-row sm:flex-wrap
              sm:items-center
              xl:justify-end
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
                  sm:w-52
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
              aria-label="Filtrar por tipo de archivo"
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

            <select
              value={tipoOrden}
              onChange={(event) =>
                setTipoOrden(
                  event.target.value as TipoOrden,
                )
              }
              aria-label="Ordenar archivos"
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
              <option value="fecha_desc">
                Mes: más reciente
              </option>
              <option value="fecha_asc">
                Mes: más antiguo
              </option>
              <option value="nombre_asc">
                Nombre: A a Z
              </option>
              <option value="nombre_desc">
                Nombre: Z a A
              </option>
            </select>

            <div
              className="
                flex items-center rounded-2xl
                border border-slate-300
                bg-[#F5F9FF] p-1 shadow-sm
              "
            >
              <button
                type="button"
                onClick={() =>
                  setTipoVista("lista")
                }
                title="Ver como lista"
                aria-label="Ver archivos como lista"
                aria-pressed={
                  tipoVista === "lista"
                }
                className={`
                  flex h-10 w-10 items-center
                  justify-center rounded-xl
                  transition-colors
                  focus:outline-none
                  focus:ring-4
                  focus:ring-pink-100
                  ${
                    tipoVista === "lista"
                      ? "bg-white text-pink-600 shadow-sm"
                      : "text-slate-500 hover:bg-white hover:text-slate-800"
                  }
                `}
              >
                <List className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setTipoVista("cuadricula")
                }
                title="Ver como cuadrícula"
                aria-label="Ver archivos como cuadrícula"
                aria-pressed={
                  tipoVista === "cuadricula"
                }
                className={`
                  flex h-10 w-10 items-center
                  justify-center rounded-xl
                  transition-colors
                  focus:outline-none
                  focus:ring-4
                  focus:ring-pink-100
                  ${
                    tipoVista === "cuadricula"
                      ? "bg-white text-pink-600 shadow-sm"
                      : "text-slate-500 hover:bg-white hover:text-slate-800"
                  }
                `}
              >
                <Grid2X2 className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={abrirModalSubida}
              className="
                flex items-center justify-center
                gap-2 rounded-2xl
                bg-pink-600 px-5 py-3
                font-semibold text-white
                shadow-sm transition-colors
                hover:bg-pink-700
                focus:outline-none focus:ring-4
                focus:ring-pink-200
              "
            >
              <Upload className="h-4 w-4" />
              Subir archivo
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
                Subí un archivo o modificá los
                filtros seleccionados.
              </p>
            </div>
          ) : tipoVista === "lista" ? (
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <div
                className="
                  hidden
                  grid-cols-[minmax(0,1fr)_150px_190px_110px]
                  items-center gap-4
                  border-b border-slate-200
                  bg-[#F5F9FF] px-5 py-3
                  text-xs font-bold uppercase
                  tracking-wide text-slate-500
                  md:grid
                "
              >
                <span>Archivo</span>
                <span>Tipo</span>
                <span>Fecha</span>
                <span className="text-right">
                  Acciones
                </span>
              </div>

              <div className="divide-y divide-slate-200">
                {archivosFiltrados.map(
                  (archivo) => (
                    <article
                      key={archivo.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        void abrirVistaPrevia(
                          archivo,
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();

                          void abrirVistaPrevia(
                            archivo,
                          );
                        }
                      }}
                      className="
                        flex cursor-pointer
                        flex-col gap-4 bg-white
                        px-5 py-4
                        transition-colors
                        hover:bg-[#FFF5F9]
                        focus:outline-none
                        focus:ring-4
                        focus:ring-inset
                        focus:ring-pink-100
                        md:grid
                        md:grid-cols-[minmax(0,1fr)_150px_190px_110px]
                        md:items-center
                      "
                    >
                      <div
                        className="
                          flex min-w-0
                          items-center gap-3
                        "
                      >
                        <div
                          className="
                            flex h-11 w-11
                            shrink-0 items-center
                            justify-center
                            rounded-2xl
                            bg-[#F5F9FF]
                            text-pink-600
                          "
                        >
                          {obtenerIconoArchivo(
                            archivo.tipo,
                            archivo.nombre,
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3
                            className="
                              truncate font-bold
                              text-slate-900
                            "
                            title={archivo.nombre}
                          >
                            {archivo.nombre}
                          </h3>

                          <p className="mt-1 text-xs text-slate-400 md:hidden">
                            {obtenerNombreTipo(
                              archivo.tipo,
                              archivo.nombre,
                            )}
                            {" · "}
                            {formatearFechaHora(
                              archivo.created_at,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="hidden md:block">
                        <span
                          className="
                            inline-flex
                            rounded-full border
                            border-slate-200
                            bg-[#F5F9FF]
                            px-3 py-1.5
                            text-xs font-semibold
                            text-slate-600
                          "
                        >
                          {obtenerNombreTipo(
                            archivo.tipo,
                            archivo.nombre,
                          )}
                        </span>
                      </div>

                      <p className="hidden text-sm text-slate-500 md:block">
                        {formatearFechaHora(
                          archivo.created_at,
                        )}
                      </p>

                      <div
                        className="
                          flex items-center gap-2
                          md:justify-end
                        "
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            evitarClickTarjeta(event);

                            void abrirVistaPrevia(
                              archivo,
                            );
                          }}
                          title="Vista previa"
                          aria-label={`Ver ${archivo.nombre}`}
                          className="
                            flex h-10 w-10
                            items-center justify-center
                            rounded-xl border
                            border-slate-300 bg-white
                            text-slate-600
                            transition-colors
                            hover:border-pink-300
                            hover:bg-pink-50
                            hover:text-pink-700
                            focus:outline-none
                            focus:ring-4
                            focus:ring-pink-100
                          "
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            evitarClickTarjeta(event);

                            void eliminarArchivo(
                              archivo,
                            );
                          }}
                          disabled={
                            deletingId ===
                            archivo.id
                          }
                          title="Eliminar archivo"
                          aria-label={`Eliminar ${archivo.nombre}`}
                          className="
                            flex h-10 w-10
                            items-center justify-center
                            rounded-xl text-red-500
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
                    </article>
                  ),
                )}
              </div>
            </div>
          ) : (
            <div
              className="
                grid grid-cols-1 gap-5
                sm:grid-cols-2
                xl:grid-cols-3
              "
            >
              {archivosFiltrados.map((archivo) => (
                <article
                  key={archivo.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    void abrirVistaPrevia(archivo)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();

                      void abrirVistaPrevia(
                        archivo,
                      );
                    }
                  }}
                  className="
                    group flex min-w-0
                    cursor-pointer flex-col
                    overflow-hidden rounded-3xl
                    border border-slate-200
                    bg-white transition-all
                    hover:-translate-y-0.5
                    hover:border-pink-300
                    hover:shadow-lg
                    focus:outline-none
                    focus:ring-4
                    focus:ring-pink-100
                  "
                >
                  <div
                    className="
                      relative h-44
                      overflow-hidden
                      border-b border-slate-200
                      bg-[#F5F9FF]
                    "
                  >
                    {renderizarMiniatura(archivo)}

                    <div
                      className="
                        absolute inset-0
                        flex items-center
                        justify-center
                        bg-slate-950/0
                        opacity-0
                        transition-all
                        group-hover:bg-slate-950/20
                        group-hover:opacity-100
                      "
                    >
                      <span
                        className="
                          flex items-center gap-2
                          rounded-2xl bg-white
                          px-4 py-2
                          text-sm font-semibold
                          text-slate-800
                          shadow-lg
                        "
                      >
                        <Eye className="h-4 w-4" />
                        Vista previa
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div
                      className="
                        flex items-start
                        justify-between gap-3
                      "
                    >
                      <div className="min-w-0">
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
                        onClick={(event) => {
                          evitarClickTarjeta(event);

                          void eliminarArchivo(
                            archivo,
                          );
                        }}
                        disabled={
                          deletingId === archivo.id
                        }
                        title="Eliminar archivo"
                        aria-label={`Eliminar ${archivo.nombre}`}
                        className="
                          flex h-9 w-9 shrink-0
                          items-center justify-center
                          rounded-xl text-red-500
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
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </Card>

      {modalSubidaAbierto && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-slate-950/50 p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarModalSubida();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-subir-archivo"
            className="
              w-full max-w-xl
              overflow-hidden rounded-3xl
              border border-slate-200
              bg-white shadow-2xl
            "
          >
            <div
              className="
                flex items-start
                justify-between gap-4
                border-b border-slate-200
                px-6 py-5
              "
            >
              <div>
                <h2
                  id="modal-subir-archivo"
                  className="text-xl font-bold text-slate-900"
                >
                  Subir archivo
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Seleccioná el archivo y elegí el
                  nombre con el que se mostrará.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModalSubida}
                disabled={uploading}
                aria-label="Cerrar"
                className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  rounded-xl text-slate-500
                  transition-colors
                  hover:bg-slate-100
                  hover:text-slate-800
                  focus:outline-none
                  focus:ring-4
                  focus:ring-slate-200
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <input
                ref={inputRef}
                type="file"
                onChange={manejarSeleccionArchivo}
                className="hidden"
              />

              {!archivoSeleccionado ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    inputRef.current?.click()
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      inputRef.current?.click();
                    }
                  }}
                  onDragEnter={manejarDragEnter}
                  onDragOver={manejarDragOver}
                  onDragLeave={manejarDragLeave}
                  onDrop={manejarDrop}
                  className={`
                    cursor-pointer rounded-3xl
                    border-2 border-dashed
                    px-6 py-12 text-center
                    transition-colors
                    focus:outline-none
                    focus:ring-4
                    focus:ring-pink-100
                    ${
                      arrastrando
                        ? "border-pink-500 bg-pink-50"
                        : "border-slate-300 bg-[#F5F9FF] hover:border-pink-400 hover:bg-[#FFF5F9]"
                    }
                  `}
                >
                  <div
                    className="
                      mx-auto flex h-14 w-14
                      items-center justify-center
                      rounded-2xl bg-white
                      text-pink-600 shadow-sm
                    "
                  >
                    <Upload className="h-6 w-6" />
                  </div>

                  <h3 className="mt-4 font-bold text-slate-800">
                    Arrastrá el archivo acá
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    O hacé clic para seleccionarlo
                    desde tu dispositivo.
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
                    Tamaño máximo: 50 MB
                  </p>
                </div>
              ) : (
                <div
                  className="
                    flex items-center gap-4
                    rounded-2xl border
                    border-slate-200
                    bg-[#F5F9FF] p-4
                  "
                >
                  <div
                    className="
                      flex h-12 w-12 shrink-0
                      items-center justify-center
                      rounded-2xl bg-white
                      text-pink-600 shadow-sm
                    "
                  >
                    {obtenerIconoArchivo(
                      archivoSeleccionado.type,
                      archivoSeleccionado.name,
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="
                        truncate font-semibold
                        text-slate-900
                      "
                      title={archivoSeleccionado.name}
                    >
                      {archivoSeleccionado.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatearTamanoArchivo(
                        archivoSeleccionado.size,
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={quitarArchivoSeleccionado}
                    disabled={uploading}
                    title="Quitar archivo"
                    aria-label="Quitar archivo seleccionado"
                    className="
                      flex h-10 w-10 shrink-0
                      items-center justify-center
                      rounded-xl text-red-500
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
              )}

              <div>
                <label
                  htmlFor="nombre-archivo"
                  className="
                    mb-2 block text-sm
                    font-semibold text-slate-700
                  "
                >
                  Nombre del archivo
                  <span className="text-pink-600">
                    {" "}
                    *
                  </span>
                </label>

                <div
                  className="
                    flex items-center rounded-2xl
                    border border-slate-300
                    bg-[#F5F9FF]
                    transition-colors
                    focus-within:border-pink-400
                    focus-within:bg-white
                    focus-within:ring-4
                    focus-within:ring-pink-100
                  "
                >
                  <input
                    id="nombre-archivo"
                    type="text"
                    value={nombreArchivo}
                    onChange={(event) =>
                      setNombreArchivo(
                        event.target.value,
                      )
                    }
                    disabled={
                      !archivoSeleccionado ||
                      uploading
                    }
                    placeholder="Ejemplo: Informe médico"
                    className="
                      min-w-0 flex-1
                      bg-transparent px-4 py-3
                      text-sm text-slate-900
                      outline-none
                      placeholder:text-slate-400
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  />
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Este nombre se usará solamente para identificar el archivo.
                </p>
              </div>

              {errorModal && (
                <div
                  className="
                    rounded-2xl border
                    border-red-200 bg-red-50
                    px-4 py-3 text-sm
                    font-medium text-red-700
                  "
                >
                  {errorModal}
                </div>
              )}
            </div>

            <div
              className="
                flex flex-col-reverse gap-3
                border-t border-slate-200
                bg-[#F5F9FF] px-6 py-5
                sm:flex-row sm:justify-end
              "
            >
              <button
                type="button"
                onClick={cerrarModalSubida}
                disabled={uploading}
                className="
                  rounded-2xl border
                  border-slate-300 bg-white
                  px-5 py-3 font-semibold
                  text-slate-700
                  transition-colors
                  hover:bg-slate-50
                  focus:outline-none
                  focus:ring-4
                  focus:ring-slate-200
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() =>
                  void subirArchivo()
                }
                disabled={
                  uploading ||
                  !archivoSeleccionado ||
                  !nombreArchivo.trim()
                }
                className="
                  flex items-center
                  justify-center gap-2
                  rounded-2xl bg-pink-600
                  px-6 py-3 font-semibold
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
                <Upload className="h-4 w-4" />

                {uploading
                  ? "Subiendo..."
                  : "Subir archivo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {archivoVistaPrevia && (
        <div
          className="
            fixed inset-0 z-[60]
            flex items-center justify-center
            bg-slate-950/70 p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarVistaPrevia();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-vista-previa"
            className="
              flex max-h-[94vh] w-full
              max-w-6xl flex-col
              overflow-hidden rounded-3xl
              border border-slate-200
              bg-white shadow-2xl
            "
          >
            <div
              className="
                flex items-center
                justify-between gap-4
                border-b border-slate-200
                px-5 py-4
              "
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="
                    flex h-10 w-10 shrink-0
                    items-center justify-center
                    rounded-xl bg-[#F5F9FF]
                    text-pink-600
                  "
                >
                  {obtenerIconoArchivo(
                    archivoVistaPrevia.tipo,
                    archivoVistaPrevia.nombre,
                  )}
                </div>

                <div className="min-w-0">
                  <h2
                    id="titulo-vista-previa"
                    className="
                      truncate font-bold
                      text-slate-900
                    "
                  >
                    {archivoVistaPrevia.nombre}
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {obtenerNombreTipo(
                      archivoVistaPrevia.tipo,
                      archivoVistaPrevia.nombre,
                    )}
                    {" · "}
                    {formatearFechaHora(
                      archivoVistaPrevia.created_at,
                    )}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void abrirArchivo(
                      archivoVistaPrevia,
                    )
                  }
                  title="Abrir archivo"
                  className="
                    flex h-10 items-center
                    justify-center gap-2
                    rounded-xl border
                    border-slate-300 bg-white
                    px-3 text-sm font-semibold
                    text-slate-700
                    transition-colors
                    hover:border-pink-300
                    hover:text-pink-700
                    focus:outline-none
                    focus:ring-4
                    focus:ring-pink-100
                  "
                >
                  <ExternalLink className="h-4 w-4" />

                  <span className="hidden sm:inline">
                    Abrir
                  </span>
                </button>

                <button
                  type="button"
                  onClick={cerrarVistaPrevia}
                  aria-label="Cerrar vista previa"
                  className="
                    flex h-10 w-10
                    items-center justify-center
                    rounded-xl text-slate-500
                    transition-colors
                    hover:bg-slate-100
                    hover:text-slate-800
                    focus:outline-none
                    focus:ring-4
                    focus:ring-slate-200
                  "
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              {renderizarContenidoVistaPrevia()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}