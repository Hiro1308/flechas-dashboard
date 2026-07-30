import { useEffect, useState } from "react";
import {
  CalendarCheck,
  Clock,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthProvider";

const items = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    label: "Participantes",
    icon: Users,
    path: "/participantes",
  },
  {
    label: "Pagos",
    icon: Wallet,
    path: "/pagos",
  },
  {
    label: "Asistencias",
    icon: CalendarCheck,
    path: "/asistencias",
  },
  {
    label: "Horarios",
    icon: Clock,
    path: "/horarios",
  },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();

  const { signOut } = useAuth();

  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const manejarEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", manejarEscape);

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", manejarEscape);

      document.body.style.overflow = overflowAnterior;
    };
  }, [open, onClose]);

  const cerrarSesion = async () => {
    if (cerrandoSesion) {
      return;
    }

    setCerrandoSesion(true);

    try {
      await signOut();

      onClose();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("No se pudo cerrar sesión:", error);
    } finally {
      setCerrandoSesion(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`
          fixed inset-0 z-40
          bg-slate-950/40
          backdrop-blur-[1px]
          transition-opacity duration-300
          lg:hidden
          ${
            open
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      />

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex h-dvh w-[280px]
          max-w-[85vw] shrink-0
          flex-col border-r
          border-slate-200 bg-white
          shadow-2xl
          transition-transform
          duration-300 ease-out
          lg:static lg:z-auto
          lg:h-screen lg:w-[260px]
          lg:max-w-none
          lg:translate-x-0
          lg:shadow-none
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-hidden={!open}
      >
        <div
          className="
            flex items-center
            justify-between gap-3
            border-b border-slate-100
            px-5 py-5
            lg:px-6 lg:py-6
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                flex h-12 w-12
                shrink-0 items-center
                justify-center rounded-2xl
              "
            >
              <img
                src="/logo.png"
                alt="Logo Flechas de Vida"
                className="
                  h-full w-full
                  object-contain
                "
              />
            </div>

            <div className="min-w-0">
              <h1
                className="
                  truncate text-lg
                  font-bold text-slate-900
                "
              >
                Flechas de Vida
              </h1>

              <p
                className="
                  truncate text-sm
                  text-slate-500
                "
              >
                Dashboard interno
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-full p-2
              text-slate-500
              transition-colors
              hover:bg-slate-100
              hover:text-slate-900
              focus:outline-none
              focus:ring-4
              focus:ring-pink-100
              lg:hidden
            "
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          className="
            flex flex-1 flex-col gap-2
            overflow-y-auto p-4
          "
        >
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `
                    flex items-center
                    gap-3 rounded-2xl
                    px-4 py-3.5
                    transition-all
                    duration-200
                    ${
                      isActive
                        ? `
                          bg-pink-100
                          text-pink-700
                          shadow-sm
                        `
                        : `
                          text-slate-600
                          hover:bg-slate-100
                          hover:text-slate-900
                        `
                    }
                  `
                }
              >
                <Icon className="h-5 w-5 shrink-0" />

                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div
          className="
            border-t border-slate-200
            px-5 py-4
          "
        >
          <button
            type="button"
            onClick={() => void cerrarSesion()}
            disabled={cerrandoSesion}
            className="
              mx-auto flex items-center
              justify-center gap-2
              text-sm font-semibold
              text-red-500
              transition-colors
              hover:text-red-700
              focus:outline-none
              focus-visible:underline
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {cerrandoSesion ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}

            <span>
              {cerrandoSesion ? "Cerrando sesión..." : "Cerrar sesión"}
            </span>
          </button>

          <div
            className="
              mt-4 flex items-center
              justify-center gap-2
              border-t border-slate-100
              pt-4
            "
          >
            <img
              src="/upsoftworks.png"
              alt="UP Softworks"
              className="
                h-7 w-7
                object-contain
              "
            />

            <div className="pl-2 leading-tight">
              <p
                className="
                  text-[10px] uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                Developed by
              </p>

              <p
                className="
                  text-xs font-semibold
                  text-slate-700
                "
              >
                UP Softworks
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
