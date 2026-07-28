import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Wallet,
  CalendarCheck,
  Clock,
} from "lucide-react";

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

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
          <img
            src="/logo.png"
            alt="Logo Flechas de Vida"
            className="h-full w-full object-contain"
          />
        </div>

        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-900">
            Flechas de Vida
          </h1>

          <p className="text-sm text-slate-500">
            Dashboard interno
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `
                  flex items-center gap-3 rounded-2xl px-4 py-3
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-pink-100 text-pink-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }
                `
              }
            >
              <Icon className="h-5 w-5 shrink-0" />

              <span className="font-medium">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-5 py-4">
        <div className="flex items-center justify-center gap-2">
          <img
            src="/upsoftworks.png"
            alt="UP Softworks"
            className="h-7 w-7 object-contain"
          />

          <div className="leading-tight pl-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Developed by
            </p>

            <p className="text-xs font-semibold text-slate-700">
              UP Softworks
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}