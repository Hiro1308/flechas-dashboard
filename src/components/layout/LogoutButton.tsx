import { LoaderCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthProvider";

export default function LogoutButton() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [loading, setLoading] = useState(false);

  const cerrarSesion = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await signOut();
      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("No se pudo cerrar sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void cerrarSesion()}
      disabled={loading}
      className="
        flex w-full items-center gap-3
        rounded-2xl px-4 py-3
        font-medium text-slate-600
        transition-colors
        hover:bg-red-50
        hover:text-red-600
        focus:outline-none
        focus:ring-4
        focus:ring-red-100
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      {loading ? (
        <LoaderCircle className="h-5 w-5 animate-spin" />
      ) : (
        <LogOut className="h-5 w-5" />
      )}

      {loading ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
