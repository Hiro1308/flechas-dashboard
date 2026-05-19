import Card from "../components/ui/Card";

export default function ParticipantesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Participantes
          </h1>

          <p className="mt-2 text-slate-500">
            Gestión de participantes
          </p>
        </div>

        <button
          className="
            rounded-2xl bg-pink-600 px-5 py-3
            font-semibold text-white
            transition hover:bg-pink-700
          "
        >
          Nueva participante
        </button>
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Nombre
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                CI
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Teléfono
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Estado
              </th>

              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Último pago
              </th>
            </tr>
          </thead>

          <tbody>
            {[1, 2, 3, 4, 5].map((item) => (
              <tr
                key={item}
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >
                <td className="px-6 py-5 font-medium">
                  María González
                </td>

                <td className="px-6 py-5 text-slate-600">
                  4.123.456-7
                </td>

                <td className="px-6 py-5 text-slate-600">
                  099 123 456
                </td>

                <td className="px-6 py-5">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Activa
                  </span>
                </td>

                <td className="px-6 py-5 text-slate-600">
                  10/05/2026
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}