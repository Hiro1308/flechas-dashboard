import Card from "../components/ui/Card";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Resumen general del sistema
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card>
          <p className="text-sm text-slate-500">
            Participantes activas
          </p>

          <h2 className="mt-3 text-4xl font-bold text-slate-900">
            48
          </h2>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">
            Pagos pendientes
          </p>

          <h2 className="mt-3 text-4xl font-bold text-red-500">
            12
          </h2>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">
            Asistencias hoy
          </p>

          <h2 className="mt-3 text-4xl font-bold text-slate-900">
            21
          </h2>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">
            Nuevos ingresos
          </p>

          <h2 className="mt-3 text-4xl font-bold text-pink-600">
            3
          </h2>
        </Card>
      </div>

      <div className="grid grid-cols-[1.2fr_0.8fr] gap-6">
        <Card className="min-h-[400px]">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">
              Últimas participantes
            </h3>

            <button className="text-sm font-semibold text-pink-600">
              Ver todas
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl border border-slate-100 p-4"
              >
                <div>
                  <h4 className="font-semibold text-slate-900">
                    María González
                  </h4>

                  <p className="text-sm text-slate-500">
                    CI: 4.123.456-7
                  </p>
                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Activa
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="min-h-[400px]">
          <h3 className="text-xl font-bold">
            Próximos pagos
          </h3>

          <div className="mt-6 flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-slate-50 p-4"
              >
                <h4 className="font-semibold">
                  Ana Rodríguez
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Vence en 3 días
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}