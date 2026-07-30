import { AlertTriangle, LoaderCircle, LogOut } from "lucide-react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  const { session, perfil, loading, profileLoading, authError, signOut } =
    useAuth();

  const verificando = loading || Boolean(session && profileLoading);

  if (verificando) {
    return (
      <div
        className="
          flex min-h-dvh
          items-center justify-center
          bg-[#FFF5F9] p-6
        "
      >
        <div className="text-center">
          <LoaderCircle
            className="
              mx-auto h-9 w-9
              animate-spin
              text-pink-600
            "
          />

          <p
            className="
              mt-3 text-sm
              font-medium text-slate-500
            "
          >
            Verificando acceso...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
        }}
      />
    );
  }

  const perfilValido = perfil?.activo === true && perfil.rol === "admin";

  if (!perfilValido) {
    const cerrarSesion = async () => {
      try {
        await signOut();

        navigate("/login", {
          replace: true,
        });
      } catch (error) {
        console.error("No se pudo cerrar sesión:", error);
      }
    };

    return (
      <div
        className="
          flex min-h-dvh
          items-center justify-center
          bg-[#FFF5F9] p-4
          sm:p-6
        "
      >
        <div
          className="
            w-full max-w-md
            rounded-3xl border
            border-slate-200
            bg-white p-6
            text-center shadow-xl
            sm:p-8
          "
        >
          <div
            className="
              mx-auto flex
              h-16 w-16
              items-center justify-center
              rounded-2xl
              bg-red-100
              text-red-700
            "
          >
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h1
            className="
              mt-5 text-xl
              font-bold text-slate-900
              sm:text-2xl
            "
          >
            Acceso no autorizado
          </h1>

          <p
            className="
              mt-3 text-sm
              leading-6 text-slate-600
            "
          >
            {!perfil
              ? authError || "Tu usuario no tiene un perfil asociado."
              : !perfil.activo
                ? "Tu usuario se encuentra desactivado."
                : "Tu usuario no tiene permisos de administrador."}
          </p>

          <button
            type="button"
            onClick={() => void cerrarSesion()}
            className="
              mt-6 flex w-full
              items-center justify-center
              gap-2 rounded-2xl
              bg-pink-600
              px-5 py-3
              font-semibold text-white
              shadow-sm transition
              hover:bg-pink-700
              focus:outline-none
              focus:ring-4
              focus:ring-pink-200
            "
          >
            <LogOut className="h-5 w-5" />
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
