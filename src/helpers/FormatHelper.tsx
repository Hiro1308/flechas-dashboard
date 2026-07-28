export default class FormatHelper {
  /**
   * Elimina puntos, guiones, espacios y cualquier
   * carácter que no sea numérico.
   *
   * Ejemplo:
   * 1.234.567-8 → 12345678
   */
  static limpiarCedula(value?: string | null): string {
    return (value ?? "")
      .replace(/\D/g, "")
      .slice(0, 8);
  }

  /**
   * Formatea progresivamente la cédula uruguaya.
   *
   * Ejemplos:
   * 1          → 1
   * 1234       → 1.234
   * 1234567    → 1.234.567
   * 12345678   → 1.234.567-8
   */
  static formatearCedula(
    value?: string | null,
  ): string {
    const numeros =
      FormatHelper.limpiarCedula(value);

    if (!numeros) {
      return "";
    }

    if (numeros.length <= 1) {
      return numeros;
    }

    if (numeros.length <= 4) {
      return `${numeros.slice(
        0,
        1,
      )}.${numeros.slice(1)}`;
    }

    if (numeros.length <= 7) {
      return `${numeros.slice(
        0,
        1,
      )}.${numeros.slice(
        1,
        4,
      )}.${numeros.slice(4)}`;
    }

    return `${numeros.slice(
      0,
      1,
    )}.${numeros.slice(
      1,
      4,
    )}.${numeros.slice(
      4,
      7,
    )}-${numeros.slice(7, 8)}`;
  }

  /**
   * Devuelve la cédula formateada o un texto alternativo
   * cuando no existe.
   */
  static mostrarCedula(
    value?: string | null,
    fallback = "Sin registrar",
  ): string {
    const numeros =
      FormatHelper.limpiarCedula(value);

    if (!numeros) {
      return fallback;
    }

    return FormatHelper.formatearCedula(
      numeros,
    );
  }

  /**
   * Valida únicamente que tenga 8 números.
   */
  static cedulaCompleta(
    value?: string | null,
  ): boolean {
    return (
      FormatHelper.limpiarCedula(value)
        .length === 8
    );
  }

  /**
   * Permite comparar una cédula guardada sin formato
   * contra una búsqueda escrita con o sin puntos y guion.
   */
  static cedulaIncluyeBusqueda(
    cedula?: string | null,
    busqueda?: string | null,
  ): boolean {
    const cedulaLimpia =
      FormatHelper.limpiarCedula(cedula);

    const busquedaLimpia =
      FormatHelper.limpiarCedula(busqueda);

    if (!busquedaLimpia) {
      return true;
    }

    return cedulaLimpia.includes(
      busquedaLimpia,
    );
  }
}