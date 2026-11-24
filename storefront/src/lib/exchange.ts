/**
 * CAMBIOS, DEVOLUCIONES Y EL DERECHO DE RETRACTO.
 *
 * Reescrito el 2026-11-24 por decisión del dueño, a raíz de una reseña que le
 * pasaron: "su política de devoluciones es bastante restrictiva... no ofrecen
 * reembolsos... algunos modelos permiten cambio de talla, pero debes
 * verificarlo individualmente". Era exacta, y ese era el problema.
 *
 * LO QUE CAMBIÓ, para quien venga después:
 *   · El cambio de talla pasó de 38 botas marcadas a TODAS, en los DOS
 *     mercados. Antes solo México y solo los modelos con el metacampo puesto.
 *   · El aviso pasó de 2 días naturales a 15. Dos días es un plazo que una
 *     persona real no cumple: un paquete entregado el viernes se encuentra el
 *     lunes y ya venció.
 *   · México acepta REEMBOLSO de dinero dentro de 5 días hábiles. Antes el
 *     sitio decía "no se realizan reembolsos" y eso, además de espantar,
 *     probablemente no era oponible.
 *
 * POR QUÉ EL REEMBOLSO NO ERA OPCIONAL. El artículo 56 de la LFPC da al
 * comprador cinco días hábiles para revocar su consentimiento sin
 * responsabilidad, y obliga al proveedor a "reintegrar al consumidor el precio
 * pagado"; los costos de flete y seguro corren por cuenta del consumidor. Rige
 * tenga el sitio la política que tenga. Mientras tanto /terminos prometía
 * "Cumplimos con la PROFECO y normativa mexicana aplicable" y /devoluciones
 * decía "No se realizan reembolsos": el sitio se contradecía a sí mismo.
 *
 * SE DECIDE POR MERCADO, NUNCA POR IDIOMA. botasleon.com también se lee en
 * español —la diáspora— y ahí el pedido es estadounidense. El derecho de
 * retracto es de la ley mexicana y de una venta mexicana; anunciárselo a un
 * comprador de Texas por leer en español sería prometer algo que no se cumple.
 * Por eso manda `isMX` y no el locale.
 */
import { isMX } from "@/lib/market"

/**
 * Metacampo de producto, hoy un INTERRUPTOR DE APAGADO y ya no de encendido.
 *
 * Hasta el 2026-11-24 era al revés: sin metacampo no había cambio, y por eso
 * solo 38 botas lo ofrecían. Ahora el cambio es de todos los modelos y este
 * metacampo sirve para QUITARLO de uno concreto —una bota hecha a la medida,
 * una pieza única— poniéndolo explícitamente en falso desde el admin, sin
 * desplegar.
 *
 * Invertirlo es seguro: los 38 productos que lo tenían en verdadero siguen
 * admitiendo cambio, y los que lo tienen vacío pasan a admitirlo, que es
 * justo lo que se pidió. Solo se apaga donde alguien escriba `false` a mano.
 */
export const METACAMPO_CAMBIO_TALLA = {
  namespace: "custom",
  key: "cambio_de_talla",
} as const

/**
 * Días NATURALES, desde la entrega, para AVISAR que se quiere el cambio.
 *
 * LO QUE VENCE EN ESTE PLAZO ES EL AVISO, NO EL CAMBIO. Es la diferencia
 * entre una política que se puede cumplir y una que no: el paquete tarda días
 * en volver a León, así que exigir el cambio HECHO en el plazo sería prometer
 * algo imposible. El cliente avisa; el cambio ocurre cuando ocurra.
 *
 * Esta cifra se pinta en la ficha, en /devoluciones, en /faq y en el JSON-LD:
 * se escribe UNA vez y aquí.
 */
export const DIAS_AVISO_CAMBIO = 15

/**
 * Días HÁBILES para cancelar la compra y recuperar el dinero. OJO: hábiles,
 * no naturales — es el plazo del artículo 56 de la LFPC, y la ley los cuenta
 * así. No mezclar con DIAS_AVISO_CAMBIO, que son naturales.
 */
export const DIAS_RETRACTO = 5

/**
 * ¿Este despliegue ofrece cambio de talla? En los dos, desde el 2026-11-24.
 *
 * Se conserva la constante aunque hoy sea `true` en todas partes: el día que
 * alguien quiera retirarlo de un mercado, este es el interruptor, y la
 * alternativa —borrarla y escribir el texto de una sola política— es cómo se
 * acaba teniendo dos redacciones que se separan.
 */
export const HAY_CAMBIO_DE_TALLA = true

/**
 * ¿Se devuelve el dinero? SOLO EN MÉXICO, porque es donde rige la LFPC y
 * donde el paquete no cruza una aduana.
 *
 * En Estados Unidos no: una devolución es un envío internacional de ida y
 * vuelta que cuesta más de 100 dólares y que haría cruzar la aduana dos
 * veces. Allá hay cambio de talla —el cliente paga el regreso— pero no
 * reembolso, y eso tiene que decirse ANTES de pagar, no después.
 */
export const HAY_REEMBOLSO = isMX

/**
 * Forma en que la Storefront API devuelve un metacampo booleano: el valor
 * viaja como la CADENA "true" o "false", no como booleano. Si el metacampo no
 * existe llega `null`.
 */
export type MetacampoCambio = { value: string } | null | undefined

/**
 * ¿Este producto admite cambio de talla? Todos, salvo que alguien lo haya
 * apagado a mano en Shopify.
 *
 * El fallo seguro cambió de lado a propósito. Antes era callar: sin metacampo
 * no se prometía nada. Ahora la promesa es general y lo excepcional es la
 * negativa, así que un metacampo ausente o ilegible significa que SÍ hay
 * cambio. Es coherente con lo que se publica: si la política dice "todos los
 * modelos", un producto mudo no puede ser la excepción silenciosa.
 */
export function admiteCambioDeTalla(metacampo: MetacampoCambio): boolean {
  if (!HAY_CAMBIO_DE_TALLA) return false
  return metacampo?.value !== "false"
}
