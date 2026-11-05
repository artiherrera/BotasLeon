import { isMX } from "@/lib/market"

/**
 * CUÁNTO TARDA EN LLEGAR, en un solo lugar.
 *
 * Lo pidió el dueño el 2026-11-05 —"hace falta especificar tiempos de entrega:
 * en México de 3 a 7 días hábiles, USA de 7 a 15 días"— y al ir a cambiarlo
 * apareció el problema de fondo: la cifra estaba escrita a mano en siete
 * sitios distintos (la página de envíos, las preguntas frecuentes por partida
 * doble, el carrito, el cajón del carrito, la ficha y dos insignias), en dos
 * idiomas cada uno. Todos los de Estados Unidos decían 2–3 días hábiles, que
 * es el plazo de una paquetería nacional, no el de un paquete que cruza la
 * frontera. Catorce cadenas para un solo dato: por eso se desfasó.
 *
 * Desde aquí sale esa cifra para todo el sitio. Los textos siguen donde
 * estaban; lo que ya no se repite es el número.
 *
 * POR MERCADO, NO POR IDIOMA. botasleon.com/es vende a Estados Unidos: ahí el
 * plazo mexicano sería una promesa falsa. `isMX` es constante de build, así que
 * cada despliegue se lleva solo su pareja de textos.
 *
 * "Días hábiles" en México y "días" a secas en Estados Unidos, tal como lo
 * dictó el dueño: el plazo mexicano es de paquetería y el americano incluye el
 * cruce y la aduana, que no entienden de días hábiles.
 *
 * El plazo cuenta DESDE QUE EL PAQUETE SALE, no desde que se confirma el
 * pedido — así lo dice la página de envíos y así hay que escribirlo donde se
 * repita.
 */

/** La ventana de entrega, para prosa: "llega normalmente entre 3 a 7 días…". */
export const PLAZO_ENTREGA = isMX
  ? { es: "3 a 7 días hábiles", en: "3 to 7 business days" }
  : { es: "7 a 15 días", en: "7 to 15 days" }

/**
 * La misma ventana en corto, con raya, para etiquetas y resúmenes: el renglón
 * "Entrega estimada: 3–7 días hábiles" del carrito y de la ficha.
 */
export const PLAZO_ENTREGA_CORTO = isMX
  ? { es: "3–7 días hábiles", en: "3–7 business days" }
  : { es: "7–15 días", en: "7–15 days" }
