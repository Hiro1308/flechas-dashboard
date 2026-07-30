import { Menu, Search } from "lucide-react";

type TopbarProps = {
  onMenuClick: () => void;
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header
      className="
        flex min-h-[72px]
        shrink-0 items-center
        justify-between gap-3
        border-b border-slate-200
        bg-white px-4 py-3
        sm:px-5
        lg:h-[80px] lg:px-6
        lg:py-0
      "
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="
            flex h-11 w-11
            shrink-0 items-center
            justify-center
            rounded-full
            text-pink-600
            transition-colors
            hover:bg-pink-50
            hover:text-pink-700
            focus:outline-none
            focus:ring-4
            focus:ring-pink-100
            lg:hidden
          "
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="min-w-0">
          <h2
            className="
              truncate text-lg
              font-bold text-slate-900
              sm:text-xl
              lg:text-2xl
            "
          >
            Flechas de Vida
          </h2>

          <p
            className="
              hidden truncate text-sm
              text-slate-500
              sm:block
            "
          >
            Bienvenido nuevamente
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div
          className="
            hidden items-center gap-3
            rounded-2xl border
            border-slate-200
            bg-[#F5F9FF]
            px-4 py-3
            transition-colors
            focus-within:border-pink-400
            focus-within:bg-white
            focus-within:ring-4
            focus-within:ring-pink-100
            md:flex
          "
        >
          <Search
            className="
              h-4 w-4 shrink-0
              text-slate-400
            "
          />

          <input
            type="search"
            placeholder="Buscar..."
            className="
              w-40 bg-transparent
              text-sm text-slate-900
              outline-none
              placeholder:text-slate-400
              xl:w-60
            "
          />
        </div>

        <div
          className="
            flex h-10 w-10
            items-center justify-center
            rounded-full bg-pink-100
            text-xs font-bold
            text-pink-700
            sm:h-11 sm:w-11
            sm:text-sm
          "
          aria-label="Usuario Flechas de Vida"
          title="Flechas de Vida"
        >
          FV
        </div>
      </div>
    </header>
  );
}
