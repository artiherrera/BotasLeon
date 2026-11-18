import type { Evento } from "@/lib/ofertas/config"

/**
 * EL TEMA DE CADA CAMPAÑA.
 *
 * Vive en su propio módulo, SIN "use client", a propósito: lo usan el cintillo
 * de la barra (componente de cliente, porque lleva reloj) y la banda de la
 * portada (de servidor). Mientras estuvo dentro del cintillo, la banda
 * reventaba la portada entera con "Attempted to call fondoTemporada() from the
 * server but fondoTemporada is on the client" — un 500, no un aviso.
 *
 * El Buen Fin era rojo porque su manual de marca lo mandaba. Black Friday no
 * tiene dueño ni manual: lo que lo identifica es el NEGRO, y aquí eso obliga a
 * una decisión, porque la barra de avisos normal ya es oscura (la tinta del
 * sitio, #191A19). Un negro casi igual no se leería como campaña, se leería
 * como un fallo de color.
 *
 * Por eso el fondo es NEGRO PURO y, sobre todo, por eso entra un ACENTO: el
 * latón #C9A227. Es lo que hace que la franja se lea distinta de un vistazo, y
 * no es un dorado cualquiera — es el tono del herraje de una bota y el vecino
 * cálido del cuero #6B4A2E que ya es el único acento del sitio. Un Black
 * Friday en rojo o en morado sería de cualquier tienda; este es de una que
 * vende cuero.
 *
 * Contraste medido sobre el negro: el latón da 8.6:1 y el blanco 21:1, los dos
 * de sobra para la AA incluso en el texto chico de las unidades.
 */
export const TEMAS: Record<Evento, { fondo: string; acento: string; cifra: string }> = {
  blackfriday: { fondo: "#000000", acento: "#C9A227", cifra: "#000000" },
  // Fuera de campaña el cintillo no se pinta, pero el tipo exige la fila.
  ofertas: { fondo: "#191A19", acento: "#C9A227", cifra: "#191A19" },
}

/** El fondo que le toca a la barra y a la banda mientras dura la campaña. */
export function fondoTemporada(evento: Evento): string {
  return TEMAS[evento].fondo
}
