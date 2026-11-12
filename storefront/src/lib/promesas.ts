import { isMX } from "@/lib/market"
import { ENVIO_GRATIS_SIEMPRE } from "@/lib/shipping-policy"
import { admiteCambioDeTalla } from "@/lib/exchange"
import type { Product } from "@/lib/shopify/types"

/**
 * Las promesas de venta que van bajo el botón de compra en la ficha.
 *
 * Sustituyen a los cuatro íconos genéricos de antes (Cuero 100%, Hecho en
 * León, Garantía 15 días, Pago seguro), que decían lo mismo en las 103 fichas
 * y no ayudaban a decidir. Estas son razones para comprar hoy, y cada una se
 * pinta SOLO si es verdad en ese mercado y para ese producto.
 *
 * Nada de esto se decide por idioma: botasleon.com/es es venta de Estados
 * Unidos, así que un texto de México ahí sería una promesa falsa.
 */
export type Promesa = {
  /** Llave del diccionario con el texto. */
  llave: string
  /** Llave del diccionario con la letra chica, si la lleva. */
  nota?: string
  /** Ícono de trazo, del set único (Lucide, 20px, 1.5). */
  icono: "whatsapp" | "envio" | "cambio" | "video"
  /**
   * En negritas, para que resalte entre las demás.
   *
   * Solo UNA de las cuatro la lleva. Si se destacan dos deja de haber
   * jerarquía: cuatro renglones en negritas se leen igual que cuatro en
   * redonda, y el ojo ya no sabe dónde posarse.
   */
  destacada?: boolean
}

/**
 * "Te mandamos video del par exacto antes de enviarlo".
 *
 * Estuvo apagada porque prometerlo en 103 fichas lo decide el dueño, no el
 * código. El 2026-09-30 lo decidió: su encargo enumera las promesas vigentes y
 * esta es la primera de las cuatro. Encendida.
 */
export const PROMESA_VIDEO = true

/**
 * Las promesas de esta ficha, en el orden en que se leen.
 *
 * El cambio de talla VOLVIÓ el 2026-11-12, después de haberse retirado del
 * sitio entero el 30 de septiembre, pero ya no es la misma promesa: entonces
 * era “sin costo” en todos los modelos etiquetados y ahora el cliente paga el
 * envió de regreso y solo aplica donde el dueño lo prenda en Shopify. Por eso
 * el texto es nuevo y no el que se borró: prometer “sin costo” otra vez sería
 * resucitar justo la frase que hubo que barrer.
 *
 * Va la ÚLTIMA de la lista a propósito. Las otras tres explican por qué
 * comprar aquí; esta quita el miedo a equivocarse de talla, que es la última
 * duda que queda antes de pagar una bota que no te puedes probar.
 */
export function promesasDeFicha(product?: Pick<Product, "cambioTalla"> | null): Promesa[] {
  const lista: Promesa[] = []

  if (PROMESA_VIDEO) lista.push({ llave: "promesa.video", icono: "video" })

  // La asesoría por WhatsApp existe en los dos mercados: el botón y el número
  // están en lib/whatsapp.ts y el buscador de talla ya ofrece escribirnos.
  lista.push({ llave: "promesa.whatsapp", icono: "whatsapp" })

  // Envío: gratis de verdad en México; en Estados Unidos lo que se promete es
  // la rapidez, porque el envío cuesta más de 100 dólares y prometerlo gratis
  // fue exactamente el error que hubo que barrer del sitio entero.
  // El PLAZO va de letra chica bajo esa línea, en los dos mercados: el dueño
  // lo pidió el 2026-11-05 y hasta hoy la ficha mexicana no decía cuándo
  // llega —solo que el envío es gratis— y la americana prometía 2–3 días
  // hábiles, que es plazo de paquetería nacional, no de un paquete que cruza
  // la frontera. La cifra sale de lib/entrega.ts.
  lista.push({
    llave: ENVIO_GRATIS_SIEMPRE ? "promesa.envioMx" : "promesa.envioUs",
    nota: "envio.estimada",
    icono: "envio",
  })

  // Cambio de talla: solo en México y solo donde esté prendido en Shopify.
  // La NOTA dice quién paga el regreso, y no es letra chica por casualidad:
  // es el término que convierte una sorpresa desagradable en una condición
  // que el cliente aceptó antes de pagar.
  if (admiteCambioDeTalla(product?.cambioTalla)) {
    lista.push({
      llave: "promesa.cambio",
      nota: "promesa.cambioNota",
      icono: "cambio",
      // La única en negritas de las cuatro, por encargo del dueño
      // (2026-11-12): es la que quita el miedo a equivocarse de talla
      // comprando una bota que no te puedes probar, y es lo más nuevo que
      // tiene la tienda que decir.
      destacada: true,
    })
  }

  return lista
}

/**
 * "Paga en 4 con Shop Pay" — REDACTADA Y APAGADA, a la espera de dos
 * comprobaciones que no puedo hacer desde el código.
 *
 * 1) Shop Pay no carga. Medido: shop.app corta la conexión (reset a los 0.13s)
 *    desde la máquina del dueño Y desde una red a miles de kilómetros, mientras
 *    shopify.com y checkout.shopify.com responden bien desde esas mismas redes.
 *    Anunciar en la cabecera un método de pago que revienta es peor que no
 *    anunciarlo: el cliente se entera de que falla DESPUÉS de querer pagar.
 *
 * 2) "Paga en 4" es Shop Pay Installments, que Shopify sirve solo a tiendas con
 *    Shopify Payments de ESTADOS UNIDOS —entidad, banco y contribuyente allá—.
 *    Esta tienda cobra desde México. Hasta que el dueño confirme en
 *    Configuración → Pagos que la tiene activa, anunciarla sería prometer un
 *    plazo que el checkout no ofrece.
 *
 * Para encenderla: poner true. El texto ya está en el diccionario.
 */
export const PAGO_EN_4 = false

/**
 * Las tres promesas de la barra de avisos, por MERCADO.
 *
 * Cuatro desde el 2026-10-21: el dueño pidió que el cintillo dijera "Pago
 * seguro". Eran tres por una razón que sigue valiendo a medias —antes fue una
 * marquesina de cuatro mensajes en bucle y ninguno se leía entero—, pero lo
 * que mata la lectura es el movimiento, no el número: estas están quietas.
 * Medido con la cuarta puesta, para que no empuje la página.
 *
 * No son la misma lista traducida: en México el argumento es el envío gratis y
 * los meses; en Estados Unidos, el envío gratis y el hecho a mano. Los meses no
 * aparecen en la .com porque los MSI son de la banca mexicana y el checkout en
 * dólares no los ofrece (ver lib/msi.ts).
 */
export const PROMESAS_BARRA: readonly string[] = isMX
  ? ["aviso.mxEnvio", "aviso.mxMeses", "aviso.mxTalla", "aviso.pagoSeguro"]
  : [
      "aviso.usEnvio",
      "aviso.usHecho",
      PAGO_EN_4 ? "aviso.usPago4" : "aviso.usTalla",
      "aviso.pagoSeguro",
    ]
