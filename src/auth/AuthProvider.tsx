import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "../services/supabase";

export type PerfilUsuario = {
  id: string;
  nombre: string;
  apellido: string;
  rol: "admin" | "usuario";
  activo: boolean;
  created_at: string;
  updated_at: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  perfil: PerfilUsuario | null;
  loading: boolean;
  profileLoading: boolean;
  authError: string;
  reloadProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);

  const [loading, setLoading] = useState(true);

  const [profileLoading, setProfileLoading] = useState(false);

  const [authError, setAuthError] = useState("");

  const cargarPerfil = async (userId?: string) => {
    const idUsuario = userId ?? session?.user.id;

    if (!idUsuario) {
      setPerfil(null);
      setProfileLoading(false);

      return;
    }

    setProfileLoading(true);
    setAuthError("");

    try {
      const { data, error } = await supabase
        .from("perfiles")
        .select(
          `
            id,
            nombre,
            apellido,
            rol,
            activo,
            created_at,
            updated_at
          `,
        )
        .eq("id", idUsuario)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        setPerfil(null);

        setAuthError("El usuario no tiene un perfil asociado.");

        return;
      }

      setPerfil(data as PerfilUsuario);
    } catch (error) {
      setPerfil(null);

      setAuthError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el perfil del usuario.",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const inicializarSesion = async () => {
      setLoading(true);
      setAuthError("");

      const { data, error } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        setSession(null);
        setPerfil(null);
        setAuthError(error.message);
        setLoading(false);

        return;
      }

      const currentSession = data.session ?? null;

      setSession(currentSession);

      if (currentSession?.user) {
        await cargarPerfil(currentSession.user.id);
      } else {
        setPerfil(null);
      }

      if (mounted) {
        setLoading(false);
      }
    };

    void inicializarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError("");

      if (nextSession?.user) {
        void cargarPerfil(nextSession.user.id);
      } else {
        setPerfil(null);
        setProfileLoading(false);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const reloadProfile = async () => {
    await cargarPerfil();
  };

  const signOut = async () => {
    setAuthError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setSession(null);
    setPerfil(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      perfil,
      loading,
      profileLoading,
      authError,
      reloadProfile,
      signOut,
    }),
    [session, perfil, loading, profileLoading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }

  return context;
}
