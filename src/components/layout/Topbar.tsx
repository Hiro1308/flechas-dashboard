import { Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="flex h-[80px] items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h2>

        <p className="text-sm text-slate-500">
          Bienvenido nuevamente
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />

          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent outline-none"
          />
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-700">
          FV
        </div>
      </div>
    </header>
  );
}