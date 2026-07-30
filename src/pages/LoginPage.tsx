import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../services/supabase";

type LocationState = {
  from?: string;
};

function obtenerMensajeError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("email not confirmed")
  ) {
    return "El correo o la contraseña no son correctos.";
  }

  if (normalized.includes("too many requests")) {
    return "Se realizaron demasiados intentos. Probá nuevamente en unos minutos.";
  }

  return message || "No se pudo iniciar sesión.";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordarme, setRecordarme] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const destino =
    (location.state as LocationState | null)?.from &&
    (location.state as LocationState).from !== "/login"
      ? (location.state as LocationState).from!
      : "/";

  useEffect(() => {
    const emailGuardado = window.localStorage.getItem(
      "flechas-de-vida-login-email",
    );

    if (emailGuardado) {
      setEmail(emailGuardado);
      setRecordarme(true);
    }
  }, []);

  if (!authLoading && session) {
    return <Navigate to={destino} replace />;
  }

  const iniciarSesion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    const emailLimpio = email.trim().toLowerCase();

    if (!emailLimpio || !password) {
      setError("Ingresá el correo y la contraseña.");
      return;
    }

    setSubmitting(true);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: emailLimpio,
        password,
      });

      if (loginError) {
        setError(obtenerMensajeError(loginError.message));
        return;
      }

      if (recordarme) {
        window.localStorage.setItem("flechas-de-vida-login-email", emailLimpio);
      } else {
        window.localStorage.removeItem("flechas-de-vida-login-email");
      }

      navigate(destino, {
        replace: true,
      });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? obtenerMensajeError(loginError.message)
          : "Ocurrió un error inesperado al iniciar sesión.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      className="
        relative min-h-dvh
        overflow-hidden bg-slate-950
      "
    >
      <div
        className="
          absolute inset-0
          bg-cover bg-center
          bg-no-repeat
        "
        style={{
          backgroundImage: "url('/foto_1.jpg')",
        }}
      />

      <div
        className="
          absolute inset-0
          bg-gradient-to-b
          from-slate-950/85
          via-slate-950/60
          to-slate-950/80
        "
      />

      <div
        className="
          absolute inset-0
          bg-slate-950/20
          backdrop-blur-[1px]
        "
      />

      <div
        className="
          relative z-10
          flex min-h-dvh
          flex-col px-4 py-5
          sm:px-7 sm:py-7
          lg:px-10 lg:py-8
        "
      >
        <div
          className="
            flex flex-1 items-center
            justify-center py-8
            sm:py-10
          "
        >
          <div
            className="
              grid w-full
              max-w-[1320px] items-center
              gap-10
              lg:-translate-x-12
              lg:grid-cols-[minmax(0,1fr)_460px]
              lg:gap-20
              xl:-translate-x-20
            "
          >
            <section
              className="
                hidden max-w-xl
                text-white lg:block
              "
            >
              <div className="mb-10 flex items-center gap-5">
                <img
                  src="/logo.png"
                  alt="Logo Flechas de Vida"
                  className="
                    h-32 w-32
                    shrink-0 object-contain
                    drop-shadow-2xl
                    xl:h-36 xl:w-36
                  "
                />

                <div>
                  <p
                    className="
                      text-3xl font-bold
                      text-white
                      drop-shadow-lg
                    "
                  >
                    Flechas de Vida
                  </p>

                  <p
                    className="
                      mt-2 text-base
                      text-white/75
                    "
                  >
                    Dashboard interno
                  </p>
                </div>
              </div>

              <p
                className="
                  text-sm font-semibold
                  uppercase
                  tracking-[0.28em]
                  text-pink-200
                "
              >
                Gestión centralizada
              </p>

              <h1
                className="
                  mt-5 text-5xl
                  font-bold leading-tight
                  drop-shadow-xl
                "
              >
                Toda la información de la organización en un solo lugar.
              </h1>

              <p
                className="
                  mt-6 max-w-lg
                  text-lg leading-8
                  text-white/80
                  drop-shadow-md
                "
              >
                Administrá participantes, pagos, asistencias, horarios y
                archivos desde un panel privado y seguro.
              </p>
            </section>

            <section className="w-full">
              <div
                className="
                  mb-8 flex items-center
                  justify-center gap-4
                  lg:hidden
                "
              >
                <img
                  src="/logo.png"
                  alt="Logo Flechas de Vida"
                  className="
                    h-20 w-20
                    object-contain
                    drop-shadow-2xl
                  "
                />

                <div>
                  <p className="text-xl font-bold text-white">
                    Flechas de Vida
                  </p>

                  <p className="mt-1 text-sm text-white/75">
                    Dashboard interno
                  </p>
                </div>
              </div>

              <div
                className="
                  mx-auto w-full
                  max-w-md rounded-[32px]
                  border border-white/30
                  bg-white/95 p-5
                  shadow-2xl
                  shadow-slate-950/40
                  backdrop-blur-xl
                  sm:p-8
                "
              >
                <div>
                  <p
                    className="
                      text-sm font-semibold
                      text-pink-600
                    "
                  >
                    Acceso privado
                  </p>

                  <h2
                    className="
                      mt-2 text-2xl
                      font-bold text-slate-900
                      sm:text-3xl
                    "
                  >
                    Iniciar sesión
                  </h2>

                  <p
                    className="
                      mt-2 text-sm
                      leading-6 text-slate-500
                    "
                  >
                    Ingresá tus credenciales para acceder al sistema.
                  </p>
                </div>

                <form onSubmit={iniciarSesion} className="mt-7 space-y-5">
                  <label className="block">
                    <span
                      className="
                        text-sm font-semibold
                        text-slate-700
                      "
                    >
                      Correo electrónico
                    </span>

                    <div
                      className="
                        mt-2 flex items-center
                        gap-3 rounded-2xl
                        border border-slate-300
                        bg-[#F5F9FF]
                        px-4 shadow-sm
                        transition
                        focus-within:border-pink-400
                        focus-within:bg-white
                        focus-within:ring-4
                        focus-within:ring-pink-100
                      "
                    >
                      <Mail
                        className="
                          h-5 w-5 shrink-0
                          text-slate-400
                        "
                      />

                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="usuario@correo.com"
                        autoComplete="email"
                        inputMode="email"
                        disabled={submitting}
                        className="
                          min-w-0 flex-1
                          bg-transparent py-3.5
                          text-base text-slate-900
                          outline-none
                          placeholder:text-slate-400
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span
                      className="
                        text-sm font-semibold
                        text-slate-700
                      "
                    >
                      Contraseña
                    </span>

                    <div
                      className="
                        mt-2 flex items-center
                        gap-3 rounded-2xl
                        border border-slate-300
                        bg-[#F5F9FF]
                        px-4 shadow-sm
                        transition
                        focus-within:border-pink-400
                        focus-within:bg-white
                        focus-within:ring-4
                        focus-within:ring-pink-100
                      "
                    >
                      <LockKeyhole
                        className="
                          h-5 w-5 shrink-0
                          text-slate-400
                        "
                      />

                      <input
                        type={mostrarPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Ingresá tu contraseña"
                        autoComplete="current-password"
                        disabled={submitting}
                        className="
                          min-w-0 flex-1
                          bg-transparent py-3.5
                          text-base text-slate-900
                          outline-none
                          placeholder:text-slate-400
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setMostrarPassword((current) => !current)
                        }
                        disabled={submitting}
                        className="
                          rounded-xl p-2
                          text-slate-400
                          transition
                          hover:bg-white
                          hover:text-slate-700
                          focus:outline-none
                          focus:ring-4
                          focus:ring-pink-100
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                        aria-label={
                          mostrarPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {mostrarPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </label>

                  <label
                    className="
                      flex cursor-pointer
                      items-center gap-3
                    "
                  >
                    <input
                      type="checkbox"
                      checked={recordarme}
                      onChange={(event) => setRecordarme(event.target.checked)}
                      disabled={submitting}
                      className="
                        h-4 w-4
                        accent-pink-600
                      "
                    />

                    <span
                      className="
                        text-sm font-medium
                        text-slate-600
                      "
                    >
                      Recordar mi correo
                    </span>
                  </label>

                  {error && (
                    <div
                      className="
                        flex items-start gap-3
                        rounded-2xl border
                        border-red-200
                        bg-red-50 p-4
                        text-sm font-medium
                        leading-5 text-red-700
                      "
                      role="alert"
                    >
                      <AlertCircle
                        className="
                          mt-0.5 h-5 w-5
                          shrink-0
                        "
                      />

                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || authLoading}
                    className="
                      flex w-full items-center
                      justify-center gap-2
                      rounded-2xl
                      bg-pink-600
                      px-5 py-3.5
                      font-semibold text-white
                      shadow-sm transition
                      hover:bg-pink-700
                      focus:outline-none
                      focus:ring-4
                      focus:ring-pink-200
                      disabled:cursor-not-allowed
                      disabled:bg-slate-300
                      disabled:text-slate-500
                    "
                  >
                    {submitting || authLoading ? (
                      <>
                        <LoaderCircle
                          className="
                            h-5 w-5
                            animate-spin
                          "
                        />
                        Ingresando...
                      </>
                    ) : (
                      "Ingresar"
                    )}
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>

        <footer
          className="
            flex items-center gap-3
            text-white/75
          "
        >
          <img
            src="/upsoftworks.png"
            alt="UP Softworks"
            className="
              h-9 w-9 object-contain
              drop-shadow-lg
              sm:h-10 sm:w-10
            "
          />

          <div className="leading-tight">
            <p
              className="
                text-[10px] uppercase
                tracking-wider
                text-white/55
              "
            >
              Developed by
            </p>

            <p
              className="
                text-sm font-semibold
                text-white
              "
            >
              UP Softworks
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
