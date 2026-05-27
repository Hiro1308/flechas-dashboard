import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Wallet,
  CalendarCheck,
  Heart,
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
    <aside className="flex w-[260px] flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100">
          <Heart className="h-6 w-6 text-pink-600" />
        </div>

        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Flechas de Vida
          </h1>

          <p className="text-sm text-slate-500">
            Dashboard interno
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-4">
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
              <Icon className="h-5 w-5" />

              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}