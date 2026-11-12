/**
 * Cambio de talla en modelos seleccionados.
 *
 * LA REGLA (encargo del 2026-11-12). En MÉXICO, los modelos marcados admiten
 * cambio por otra talla del mismo modelo. El cliente paga el envío de regreso
 * y BotasLeón manda la talla nueva. Para pedirlo hay que AVISAR dentro de los
 * dos días naturales siguientes a la entrega.
 *
 * LO QUE VENCE A LOS DOS DÍAS ES EL AVISO, NO EL CAMBIO. Es la diferencia
 * entre una política que se puede cumplir y una que no: el paquete tarda días
 * en volver a León, así que exigir que el cambio esté HECHO en dos días sería
 * prometer algo imposible. El cliente avisa; el cambio ocurre cuando ocurra.
 *
 * EN ESTADOS UNIDOS NO APLICA y el pedido sigue siendo venta final: cruzaría
 * la aduana dos veces y el comprador ya pagó aranceles a la entrada, que no se
 * recuperan.
 *
 * SE DECIDE POR MERCADO, NUNCA POR IDIOMA. botasleon.com también se lee en
 * español —la diáspora— y ahí el pedido es estadounidense: anunciarle un
 * cambio por leer en español sería prometer algo que no se cumple. Por eso
 * manda `isMX` y no el locale.
 *
 * Hoy botasleon.mx publica SOLO español (lib/i18n/config.ts: LOCALES) y /en
 * redirige con 308 a /es, así que el inglés mexicano no se pinta en ninguna
 * parte. Las ramas en inglés de la política existen igual, por si ese día
 * llega: lo que NO puede pasar es que la regla se escriba por locale y luego
 * alguien publique inglés en la .mx y se apague el cambio sin que nadie lo
 * note.
 *
 * EL INTERRUPTOR VIVE EN SHOPIFY, no en el código, para poder prenderlo y
 * apagarlo modelo por modelo —o marca por marca— desde el admin sin desplegar.
 *
 * Antes era una ETIQUETA de producto y ahora es un METACAMPO, por encargo del
 * dueño: el catálogo no usa etiquetas para nada más y una etiqueta suelta no
 * se ve en la ficha del admin a menos que la busques, mientras que el
 * metacampo sale como una casilla con su nombre y su explicación. La etiqueta
 * nunca llegó a usarse en ningún producto, así que no hay nada que migrar.
 */
import { isMX } from "@/lib/market"

/**
 * Metacampo de producto que lo prende. Hay que crearlo en Shopify →
 * Configuración → Datos personalizados → Productos, de tipo verdadero/falso y
 * con acceso de lectura para el Storefront, o el sitio no lo verá nunca.
 *
 * Para prenderlo en una marca entera: Productos → filtrar por proveedor →
 * seleccionar todos → editar en bloque.
 */
export const METACAMPO_CAMBIO_TALLA = {
  namespace: "custom",
  key: "cambio_de_talla",
} as const

/**
 * Días NATURALES, contados desde la entrega, para AVISAR que se quiere el
 * cambio. Esta cifra se pinta en la ficha, en /devoluciones, en /faq y en el
 * JSON-LD de preguntas frecuentes: se escribe UNA vez y aquí.
 */
export const DIAS_AVISO_CAMBIO = 2

/** ¿Este despliegue ofrece cambio de talla? Decide qué política se publica. */
export const HAY_CAMBIO_DE_TALLA = isMX

/**
 * Forma en que la Storefront API devuelve un metacampo booleano: el valor
 * viaja como la CADENA "true" o "false", no como booleano. Si el metacampo no
 * existe todavía —o no se le dio acceso de lectura al Storefront— llega
 * `null`, y entonces no se promete nada. Ese es el lado seguro del fallo:
 * callar de más, nunca prometer de más.
 */
export type MetacampoCambio = { value: string } | null | undefined

/** ¿Este producto en concreto admite cambio de talla? */
export function admiteCambioDeTalla(metacampo: MetacampoCambio): boolean {
  if (!HAY_CAMBIO_DE_TALLA) return false
  return metacampo?.value === "true"
}
